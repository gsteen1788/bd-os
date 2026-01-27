import { useState, useRef, useEffect } from "react";
import { Task, Opportunity, ProtemoiEntry, Contact, TaskLink } from "../../domain/entities";
import { EntityType, TaskTag } from "../../domain/enums";

interface AdminTaskBarProps {
    tasks: Task[];
    opportunities: Opportunity[];
    relationships: { entry: ProtemoiEntry, contact: Contact }[];
    history: Task[];
    onCreate: (title: string, dueDate: string, links: { type: EntityType, id: string }[], tag?: TaskTag | null) => Promise<void>;
    onComplete: (task: Task) => Promise<void>;
    onUpdate: (task: Task) => Promise<void>;
    onDelete: (task: Task) => Promise<void>;
    onRevert: (task: Task) => Promise<void>;
}

export function AdminTaskBar({ tasks, history, opportunities, relationships, onCreate, onComplete, onUpdate, onDelete, onRevert }: AdminTaskBarProps) {
    // View State
    const [viewMode, setViewMode] = useState<"PENDING" | "DONE">("PENDING");

    const [filterTag, setFilterTag] = useState<TaskTag | "ALL">("ALL");

    const displayTasks = (viewMode === "PENDING" ? tasks : history).filter(t => filterTag === "ALL" || t.tag === filterTag);

    // Creation/Editing State
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedTag, setSelectedTag] = useState<TaskTag | null>(null);
    const [selectedLinks, setSelectedLinks] = useState<{ type: EntityType, id: string, name: string }[]>([]);

    // UI State
    const [showLinkPicker, setShowLinkPicker] = useState(false);
    const [pickerTab, setPickerTab] = useState<"OPPORTUNITY" | "REL_EXTERNAL" | "REL_INTERNAL">("OPPORTUNITY");
    const pickerRef = useRef<HTMLDivElement>(null);

    // Close picker on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowLinkPicker(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Monitor height
    const rootRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!rootRef.current) return;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                // Add padding/border if contentRect doesn't include it, or use offsetHeight if needed.
                // ResizeObserver contentRect is content box. offsetHeight is usually safer for layout.
                // Let's rely on standard box model, usually we want the full visual block.
                // But ResizeObserver doesn't give offsetHeight directly.
                // We can access the element:
                const el = entry.target as HTMLElement;
                document.documentElement.style.setProperty('--admin-bar-height', `${el.offsetHeight}px`);
            }
        });
        observer.observe(rootRef.current);
        return () => {
            observer.disconnect();
            document.documentElement.style.removeProperty('--admin-bar-height');
        };
    }, []);

    // Populate form when editing
    useEffect(() => {
        if (editingTask) {
            setTitle(editingTask.title);
            setDueDate(editingTask.dueDate || new Date().toISOString().split('T')[0]);
            setSelectedTag(editingTask.tag || null);

            const links = editingTask.links && editingTask.links.length > 0
                ? editingTask.links
                : (editingTask.linkedEntityType !== 'NONE' && editingTask.linkedEntityId ? [{ entityType: editingTask.linkedEntityType, entityId: editingTask.linkedEntityId } as TaskLink] : []);

            const mappedLinks = links.map(l => {
                if (l.entityType === 'OPPORTUNITY') {
                    const opp = opportunities.find(o => o.id === l.entityId);
                    return { type: 'OPPORTUNITY' as EntityType, id: l.entityId, name: opp ? opp.name : 'Unknown' };
                } else {
                    const rel = relationships.find(r => r.entry.id === l.entityId);
                    return { type: 'RELATIONSHIP' as EntityType, id: l.entityId, name: rel ? rel.contact.displayName : 'Unknown' };
                }
            });
            setSelectedLinks(mappedLinks);
        } else {
            setTitle("");
            setDueDate(new Date().toISOString().split('T')[0]);
            setSelectedTag(null);
            setSelectedLinks([]);
        }
    }, [editingTask, opportunities, relationships]);

    const handleSave = async () => {
        if (!title.trim()) return;

        if (editingTask) {
            // Update existing
            await onUpdate({
                ...editingTask,
                title,
                dueDate,
                tag: selectedTag,
                links: selectedLinks.map(l => ({
                    id: crypto.randomUUID(), // New link ID
                    taskId: editingTask.id,
                    entityType: l.type,
                    entityId: l.id,
                    createdAt: new Date().toISOString()
                }))
            });
            setEditingTask(null);
        } else {
            // Create new
            await onCreate(title, dueDate, selectedLinks.map(l => ({ type: l.type, id: l.id })), selectedTag);
        }

        // Reset form
        setTitle("");
        setSelectedTag(null);
        setSelectedLinks([]);
        setEditingTask(null);
    };

    const handleCancel = () => {
        setEditingTask(null);
        setTitle("");
        setSelectedTag(null);
        setSelectedLinks([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
    };

    const getLinkDisplay = (link: TaskLink) => {
        if (link.entityType === 'OPPORTUNITY') {
            const opp = opportunities.find(o => o.id === link.entityId);
            return opp ? opp.name : 'Unknown Opp';
        } else if (link.entityType === 'RELATIONSHIP') {
            const rel = relationships.find(r => r.entry.id === link.entityId);
            return rel ? rel.contact.displayName : 'Unknown Rel';
        }
        return link.entityType;
    };

    const getTagColor = (tag: TaskTag) => {
        switch (tag) {
            case 'BD_TASK': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
            case 'BD_INTERNAL_MEETING': return 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30';
            case 'BD_EXTERNAL_MEETING': return 'bg-green-500/20 text-green-500 border-green-500/30';
            case 'PROJECT': return 'bg-purple-500/20 text-purple-500 border-purple-500/30';
            case 'OFFICE': return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
            case 'OTHER': return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
            default: return 'bg-base-200 text-muted';
        }
    };

    const getTagShort = (tag: TaskTag) => {
        switch (tag) {
            case 'BD_TASK': return 'BD';
            case 'BD_INTERNAL_MEETING': return 'INT';
            case 'BD_EXTERNAL_MEETING': return 'EXT';
            case 'PROJECT': return 'PRJ';
            case 'OFFICE': return 'OFF';
            case 'OTHER': return 'OTH';
            default: return tag;
        }
    };

    return (
        <div ref={rootRef} className="bg-base-200 border-t border-[hsl(var(--color-border))] py-3 px-6 flex flex-col gap-3 shrink-0 z-[60] shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                        Admin / Routine Tasks
                    </h4>
                    <select
                        className="select select-xs select-ghost h-6 min-h-0 text-[10px] uppercase font-bold text-muted/50"
                        value={filterTag}
                        onChange={(e) => setFilterTag(e.target.value as TaskTag | "ALL")}
                    >
                        <option value="ALL">ALL TAGS</option>
                        {TaskTag.map(tag => (
                            <option key={tag} value={tag}>{tag.replace('_', ' ')}</option>
                        ))}
                    </select>
                    <select
                        className="select select-xs select-ghost h-6 min-h-0 text-[10px] uppercase font-bold text-muted/50"
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as "PENDING" | "DONE")}
                    >
                        <option value="PENDING">PENDING ({tasks.length})</option>
                        <option value="DONE">DONE ({history.length})</option>
                    </select>
                </div>
            </div>

            <div className="flex items-start gap-4 h-full">
                {/* Task List (Horizontal Scroll) */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar pb-2" style={{ maxHeight: '140px' }}>
                    <div className="flex gap-3 h-full items-stretch">
                        {displayTasks.map(task => (
                            <div
                                key={task.id}
                                className={`group flex flex-col justify-between p-3 bg-base-100 rounded-lg border min-w-[200px] max-w-[200px] min-h-[90px] hover:shadow-lg transition-all relative cursor-pointer ${editingTask?.id === task.id ? 'border-primary ring-1 ring-primary' : 'border-[hsl(var(--color-border))] hover:border-secondary/30'}`}
                                onClick={() => setEditingTask(task)}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex flex-col gap-1 w-full min-w-0">
                                        {task.tag && (
                                            <span className={`text-[8px] font-bold px-1 py-0.5 rounded border self-start ${getTagColor(task.tag)}`}>
                                                {task.tag.replace('_', ' ')}
                                            </span>
                                        )}
                                        <span className={`text-xs font-semibold line-clamp-2 leading-tight ${task.status === 'DONE' ? 'line-through opacity-50' : ''}`} title={task.title}>{task.title}</span>
                                    </div>
                                    {viewMode === "PENDING" ? (
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-xs checkbox-secondary rounded-sm border-[hsl(var(--color-border))]"
                                            checked={false} // Always false until clicked
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                onComplete(task);
                                            }}
                                            title="Mark Complete"
                                        />
                                    ) : (
                                        <button
                                            className="btn btn-xs btn-ghost text-warning p-0 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRevert(task);
                                            }}
                                            title="Revert to Pending"
                                        >
                                            ↩
                                        </button>
                                    )}
                                </div>
                                <div className="flex justify-between items-end mt-1">
                                    <div className="flex flex-col gap-0.5">
                                        <span className={`text-[10px] ${new Date(task.dueDate || '') < new Date() ? 'text-error' : 'text-muted'}`}>
                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Date'}
                                        </span>
                                        {viewMode === "DONE" && task.durationMinutes && (
                                            <span className="text-[10px] font-mono text-success">{task.durationMinutes}m</span>
                                        )}
                                        {task.links && task.links.length > 0 && (
                                            <div className="flex flex-wrap gap-1 max-w-[120px]">
                                                {task.links.map((link, i) => (
                                                    <span key={i} className="text-[9px] opacity-70 truncate flex items-center gap-1 max-w-full">
                                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${link.entityType === 'OPPORTUNITY' ? 'bg-blue-400' : 'bg-orange-400'}`}></span>
                                                        <span className="truncate">{getLinkDisplay(link)}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {displayTasks.length === 0 && (
                            <div className="flex items-center justify-center min-w-[200px] h-[80px] border border-dashed border-white/10 rounded-lg text-xs text-muted italic">
                                No {viewMode === "PENDING" ? "pending" : "completed"} tasks
                            </div>
                        )}
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-20 bg-[hsl(var(--color-border))] shrink-0 mx-2"></div>

                {/* Create New (Compact) */}
                <div className="w-[300px] shrink-0 flex flex-col gap-2">
                    <div className="flex gap-2">
                        <input
                            className="input text-xs h-8 flex-1"
                            placeholder={editingTask ? "Edit task..." : "New Admin Task..."}
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        {editingTask && (
                            <button className="btn btn-sm btn-ghost h-8 w-8 p-0 flex items-center justify-center text-muted hover:text-main" onClick={handleCancel} title="Cancel Edit">
                                ×
                            </button>
                        )}
                        {editingTask && (
                            <button className="btn btn-sm btn-ghost h-8 w-8 p-0 flex items-center justify-center text-error/50 hover:text-error" onClick={() => { onDelete(editingTask); setEditingTask(null); }} title="Delete Task">
                                🗑️
                            </button>
                        )}
                        <button className={`btn btn-sm h-8 w-8 p-0 flex items-center justify-center ${editingTask ? 'btn-primary' : 'btn-secondary'}`} onClick={handleSave} title={editingTask ? "Save Changes" : "Create Task"}>
                            {editingTask ? '✓' : '+'}
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            className="input text-xs h-7 w-28 px-1"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                        />

                        {/* Tag Selector */}
                        <select
                            className="select select-xs select-ghost h-7 min-h-0 text-[10px] uppercase font-bold text-muted/80 border border-[hsl(var(--color-border))] rounded px-2"
                            value={selectedTag || ""}
                            onChange={(e) => setSelectedTag(e.target.value ? e.target.value as TaskTag : null)}
                        >
                            <option value="">No Tag</option>
                            {TaskTag.map(tag => (
                                <option key={tag} value={tag}>{getTagShort(tag)}</option>
                            ))}
                        </select>

                        {/* Link Picker Trigger */}
                        <div className="relative flex-1" ref={pickerRef}>
                            <button
                                className={`w-full h-7 text-xs border rounded px-2 flex items-center gap-1 hover:bg-black/5 overflow-hidden ${selectedLinks.length > 0 ? 'border-primary/50 text-base-content' : 'border-[hsl(var(--color-border))] text-muted'}`}
                                onClick={() => setShowLinkPicker(!showLinkPicker)}
                            >
                                {selectedLinks.length > 0 ? (
                                    <div className="flex gap-1 overflow-x-auto no-scrollbar items-center w-full">
                                        {selectedLinks.map((link, i) => (
                                            <div key={i} className="flex items-center gap-1 bg-black/5 rounded px-1 shrink-0 max-w-[100px]">
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${link.type === 'OPPORTUNITY' ? 'bg-blue-400' : 'bg-orange-400'}`}></span>
                                                <span className="truncate text-[10px]">{link.name}</span>
                                                <span
                                                    className="ml-1 opacity-50 hover:opacity-100 cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedLinks(selectedLinks.filter((_, idx) => idx !== i));
                                                    }}
                                                >
                                                    ×
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <>+ Link</>
                                )}
                            </button>

                            {/* Link Picker Dropdown */}
                            {showLinkPicker && (
                                <div className="absolute bottom-full right-0 mb-2 w-64 bg-base-100 border border-[hsl(var(--color-border))] shadow-xl rounded-lg z-[60] p-2 flex flex-col gap-2">
                                    <div className="flex p-0.5 bg-base-200 rounded">
                                        <button
                                            className={`flex-1 py-1 text-[10px] font-bold rounded ${pickerTab === 'OPPORTUNITY' ? 'text-white' : 'text-muted hover:text-main'}`}
                                            style={pickerTab === 'OPPORTUNITY' ? { backgroundColor: 'hsl(var(--color-primary))' } : {}}
                                            onClick={() => setPickerTab('OPPORTUNITY')}
                                        >
                                            OPP
                                        </button>
                                        <button
                                            className={`flex-1 py-1 text-[10px] font-bold rounded ${pickerTab === 'REL_EXTERNAL' ? 'text-white' : 'text-muted hover:text-main'}`}
                                            style={pickerTab === 'REL_EXTERNAL' ? { backgroundColor: 'hsl(var(--color-primary))' } : {}}
                                            onClick={() => setPickerTab('REL_EXTERNAL')}
                                        >
                                            EXT
                                        </button>
                                        <button
                                            className={`flex-1 py-1 text-[10px] font-bold rounded ${pickerTab === 'REL_INTERNAL' ? 'text-white' : 'text-muted hover:text-main'}`}
                                            style={pickerTab === 'REL_INTERNAL' ? { backgroundColor: 'hsl(var(--color-primary))' } : {}}
                                            onClick={() => setPickerTab('REL_INTERNAL')}
                                        >
                                            INT
                                        </button>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto flex flex-col gap-1 custom-scrollbar p-1">
                                        {pickerTab === 'OPPORTUNITY' && opportunities.map(o => (
                                            <button key={o.id} className="w-full text-left text-xs px-2 py-2 min-h-[34px] flex items-center hover:bg-black/5 rounded text-main group" onClick={() => {
                                                if (selectedLinks.find(l => l.id === o.id)) return;
                                                setSelectedLinks([...selectedLinks, { type: 'OPPORTUNITY', id: o.id, name: o.name }]);
                                                setShowLinkPicker(false);
                                            }}>
                                                <span className="truncate w-full">{o.name}</span>
                                            </button>
                                        ))}
                                        {pickerTab === 'REL_EXTERNAL' && relationships.filter(r => !r.entry.isInternal).map(r => (
                                            <button key={r.entry.id} className="w-full text-left text-xs px-2 py-2 min-h-[34px] flex items-center hover:bg-black/5 rounded text-main group" onClick={() => {
                                                if (selectedLinks.find(l => l.id === r.entry.id)) return;
                                                setSelectedLinks([...selectedLinks, { type: 'RELATIONSHIP', id: r.entry.id, name: r.contact.displayName }]);
                                                setShowLinkPicker(false);
                                            }}>
                                                <span className="truncate w-full">{r.contact.displayName}</span>
                                            </button>
                                        ))}
                                        {pickerTab === 'REL_INTERNAL' && relationships.filter(r => r.entry.isInternal).map(r => (
                                            <button key={r.entry.id} className="w-full text-left text-xs px-2 py-2 min-h-[34px] flex items-center hover:bg-black/5 rounded text-main group" onClick={() => {
                                                if (selectedLinks.find(l => l.id === r.entry.id)) return;
                                                setSelectedLinks([...selectedLinks, { type: 'RELATIONSHIP', id: r.entry.id, name: r.contact.displayName }]);
                                                setShowLinkPicker(false);
                                            }}>
                                                <span className="truncate w-full">{r.contact.displayName}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
