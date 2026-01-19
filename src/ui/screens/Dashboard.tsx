import { useEffect, useState } from "react";
import { Task, TaskLink, Opportunity, ProtemoiEntry, Contact } from "../../domain/entities";
import { taskRepository, opportunityRepository, protemoiRepository, contactRepository } from "../../infrastructure/repositories";
import { MITModal } from "../components/MITModal";
import { AdminTaskBar } from "../components/AdminTaskBar";
import { EntityType } from "../../domain/enums";
import { useTheme } from "../../application/ThemeContext";

import { groupItemsByWeek } from "../../utils/dateUtils";

export function Dashboard() {
    const { theme } = useTheme();
    const [mits, setMits] = useState<Task[]>([]);
    const [adminTasks, setAdminTasks] = useState<Task[]>([]);
    const [adminHistory, setAdminHistory] = useState<Task[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [relationships, setRelationships] = useState<{ entry: ProtemoiEntry, contact: Contact }[]>([]);
    const [viewMode, setViewMode] = useState<"PENDING" | "HISTORY">("PENDING");

    const [showMITModal, setShowMITModal] = useState(false);
    const [editingMIT, setEditingMIT] = useState<Task | undefined>(undefined);

    useEffect(() => {
        loadData();
    }, [viewMode]);

    const loadData = async () => {
        try {
            const [tasks, history, opps, protemoi, contacts] = await Promise.all([
                viewMode === "PENDING" ? taskRepository.findPending() : taskRepository.findHistory(50),
                taskRepository.findHistory(50), // Always fetch recent history for Admin Bar regardless of view mode? Or only if needed. Let's fetch it always for now to simplify.
                opportunityRepository.findAll(),
                protemoiRepository.findAll(),
                contactRepository.findAll()
            ]) as [Task[], Task[], Opportunity[], ProtemoiEntry[], Contact[]];

            setMits(tasks.filter(t => t.type !== 'ADMIN'));
            setAdminTasks(tasks.filter(t => t.type === 'ADMIN'));

            // For admin history, we want tasks that are type ADMIN and status DONE/CANCELED
            // The findHistory returns mixed types.
            setAdminHistory(history.filter(t => t.type === 'ADMIN'));

            setOpportunities(opps);

            const rels = protemoi.map(p => {
                const contact = contacts.find(c => c.id === p.contactId);
                return contact ? { entry: p, contact } : null;
            }).filter(Boolean) as { entry: ProtemoiEntry, contact: Contact }[];
            setRelationships(rels);

        } catch (e) {
            console.error("Failed to load dashboard data", e);
        }
    };

    const handleCreate = () => {
        setEditingMIT(undefined);
        setShowMITModal(true);
    };

    const handleEdit = (task: Task) => {
        setEditingMIT(task);
        setShowMITModal(true);
    };

    const handleCompleteMIT = async (task: Task) => {
        if (!confirm("Mark this MIT as complete?")) return;
        try {
            await taskRepository.save({
                ...task,
                status: 'DONE',
                updatedAt: new Date().toISOString()
            });
            loadData();
        } catch (e) {
            console.error("Failed to complete MIT", e);
            alert("Failed to complete MIT");
        }
    };

    const handleUncompleteMIT = async (task: Task) => {
        if (!confirm("Revert this task to Pending?")) return;
        try {
            await taskRepository.save({
                ...task,
                status: 'TODO',
                updatedAt: new Date().toISOString()
            });
            loadData();
        } catch (e) {
            console.error("Failed to uncomplete MIT", e);
            alert("Failed to revert MIT");
        }
    };

    const handleCreateAdminTask = async (title: string, dueDate: string, links: { type: EntityType, id: string }[]) => {
        try {
            const taskId = crypto.randomUUID();
            await taskRepository.save({
                id: taskId,
                title,
                status: 'TODO',
                type: 'ADMIN',
                dueDate,
                linkedEntityType: links.length > 0 ? links[0].type : "NONE", // DEPRECATED: Keep sync for now
                linkedEntityId: links.length > 0 ? links[0].id : null,       // DEPRECATED
                links: links.map(l => ({
                    id: crypto.randomUUID(),
                    taskId,
                    entityType: l.type,
                    entityId: l.id,
                    createdAt: new Date().toISOString()
                })),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            loadData();
        } catch (e) {
            console.error("Failed to create Admin Task", e);
            alert("Failed to create task");
        }
    };

    const handleUpdateAdminTask = async (task: Task) => {
        try {
            await taskRepository.save({
                ...task,
                updatedAt: new Date().toISOString()
            });
            loadData();
        } catch (e) {
            console.error("Failed to update Admin Task", e);
            alert("Failed to update task");
        }
    };

    const handleCompleteAdminTask = async (task: Task) => {
        try {
            await taskRepository.save({
                ...task,
                status: 'DONE',
                updatedAt: new Date().toISOString()
            });
            loadData();
        } catch (e) {
            console.error("Failed to complete Admin Task", e);
        }
    };

    const handleDeleteAdminTask = async (task: Task) => {
        if (!confirm("Delete this task?")) return;
        try {
            await taskRepository.save({
                ...task,
                status: 'CANCELED',
                updatedAt: new Date().toISOString()
            });
            loadData();
        } catch (e) {
            console.error("Failed to delete Admin Task", e);
            alert("Failed to delete task");
        }
    };

    const handleModalClose = () => {
        setShowMITModal(false);
        setEditingMIT(undefined);
    };

    const getLinkDisplay = (link: TaskLink) => {
        if (link.entityType === 'OPPORTUNITY') {
            const opp = opportunities.find(o => o.id === link.entityId);
            return opp ? opp.name : 'Unknown Opportunity';
        } else if (link.entityType === 'RELATIONSHIP') {
            const rel = relationships.find(r => r.entry.id === link.entityId);
            return rel ? rel.contact.displayName : 'Unknown Relationship';
        }
        return link.entityType;
    };

    const getLegacyLinkDisplay = (type: string, id: string | null) => {
        if (!id) return type;
        if (type === 'OPPORTUNITY') {
            const opp = opportunities.find(o => o.id === id);
            return opp ? opp.name : type;
        } else if (type === 'RELATIONSHIP') {
            const rel = relationships.find(r => r.entry.id === id);
            return rel ? rel.contact.displayName : type;
        }
        return type;
    };

    const getMitIcon = () => {
        switch (theme) {
            case 'solar': return '/icons/sl-MIT.png';
            case 'kings-quest': return '/icons/kq-MIT.png';
            case 'dark':
            default: return '/icons/cg-MIT.png';
        }
    };

    const renderMitCard = (mit: Task) => (
        <div
            key={mit.id}
            className={`card border border-[hsl(var(--color-border))] hover:border-primary/50 transition-all p-0 flex flex-col gap-0 group hover:shadow-lg hover:shadow-primary/5 cursor-pointer overflow-hidden relative ${viewMode === 'HISTORY' ? 'bg-base-300 opacity-80' : 'bg-base-200'}`}
            onClick={() => handleEdit(mit)}
        >
            {/* Card Header */}
            <div className="p-4 pb-2 flex justify-between items-start">
                <span className="text-xs font-mono font-medium opacity-50">{mit.dueDate}</span>
                <div className="flex gap-2 items-center">
                    {/* Complete/Revert Button */}
                    {viewMode === 'PENDING' ? (
                        <button
                            className="btn btn-sm btn-ghost opacity-0 group-hover:opacity-100 transition-opacity text-success absolute top-2 right-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteMIT(mit);
                            }}
                            title="Mark as Complete"
                        >
                            ✓
                        </button>
                    ) : (
                        <button
                            className="btn btn-sm btn-ghost opacity-0 group-hover:opacity-100 transition-opacity text-warning absolute top-2 right-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleUncompleteMIT(mit);
                            }}
                            title="Revert to Pending"
                        >
                            ↩
                        </button>
                    )}

                    <div className="flex gap-2 mr-8"> {/* Added margin-right to avoid overlap with button if visible, or just let it overlay? Better to shift items left or just use absolute positioning wisely. */}
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${mit.bigImpactDescription ? 'bg-primary/20 text-primary border-primary/30' : 'bg-base-300 text-muted border-transparent'}`}
                            title={mit.bigImpactDescription || 'Big Impact'}
                        >
                            B
                        </div>
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${mit.inControlDescription ? 'bg-success/20 text-success border-success/30' : 'bg-base-300 text-muted border-transparent'}`}
                            title={mit.inControlDescription || 'In Control'}
                        >
                            I
                        </div>
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${mit.growthOrientedDescription ? 'bg-warning/20 text-warning border-warning/30' : 'bg-base-300 text-muted border-transparent'}`}
                            title={mit.growthOrientedDescription || 'Growth Oriented'}
                        >
                            G
                        </div>
                    </div>
                </div>
            </div>

            {/* Title */}
            <div className="px-4 pb-4">
                <h3 className={`text-lg font-bold leading-tight group-hover:text-primary transition-colors ${viewMode === 'HISTORY' ? 'line-through text-muted' : ''}`}>{mit.title}</h3>
            </div>

            {/* B.I.G. Details (Subtle) */}
            <div className="px-4 flex flex-col gap-2 mb-4">
                {mit.bigImpactDescription && (
                    <div className="flex gap-2 items-start text-xs text-muted/80">
                        <span className="text-primary font-bold mt-0.5">B</span>
                        <span className="line-clamp-2 italic opacity-80">{mit.bigImpactDescription}</span>
                    </div>
                )}
                {mit.inControlDescription && (
                    <div className="flex gap-2 items-start text-xs text-muted/80">
                        <span className="text-success font-bold mt-0.5">I</span>
                        <span className="line-clamp-2 italic opacity-80">{mit.inControlDescription}</span>
                    </div>
                )}
                {mit.growthOrientedDescription && (
                    <div className="flex gap-2 items-start text-xs text-muted/80">
                        <span className="text-warning font-bold mt-0.5">G</span>
                        <span className="line-clamp-2 italic opacity-80">{mit.growthOrientedDescription}</span>
                    </div>
                )}
            </div>

            {/* Footer / Links */}
            <div className="mt-auto p-3 bg-black/20 border-t border-[hsl(var(--color-border))] flex flex-wrap gap-2">
                {mit.links && mit.links.length > 0 ? (
                    mit.links.map((link, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-base-100 rounded border border-white/5 max-w-full">
                            <div className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${link.entityType === 'OPPORTUNITY' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                {link.entityType === 'OPPORTUNITY' ? 'O' : 'R'}
                            </div>
                            <span className="truncate text-[10px] opacity-80">{getLinkDisplay(link)}</span>
                        </div>
                    ))
                ) : mit.linkedEntityType !== "NONE" && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-base-100 rounded border border-[hsl(var(--color-border))] max-w-full">
                        <span className="text-[10px] opacity-60 uppercase font-bold">{mit.linkedEntityType[0]}</span>
                        <span className="truncate text-[10px] opacity-80">{getLegacyLinkDisplay(mit.linkedEntityType, mit.linkedEntityId || null)}</span>
                    </div>
                )}
                {viewMode === 'HISTORY' && (
                    <div className="ml-auto text-xs text-muted italic">
                        Completed: {new Date(mit.updatedAt).toLocaleDateString()}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            <MITModal
                isOpen={showMITModal}
                onClose={handleModalClose}
                onSave={loadData}
                initialTask={editingMIT}
            />

            <div className="flex justify-between items-center h-[70px] px-6 border-b border-[hsl(var(--color-border))] bg-base sticky top-0 z-10">
                <div>
                    <h2 className="text-xl font-semibold m-0 tracking-tight flex items-center gap-2">
                        <img src={getMitIcon()} alt="MIT" className="w-8 h-8 object-contain" />
                        Most Important Tasks
                    </h2>
                    {/* Subtitle removed or moved to keep header height consistent, or we keep it if it fits */}
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="input"
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as "PENDING" | "HISTORY")}
                        style={{ minWidth: "150px", fontWeight: "bold", cursor: "pointer" }}
                    >
                        <option value="PENDING">Active MITs</option>
                        <option value="HISTORY">MIT History</option>
                    </select>
                    <button className="btn btn-primary" onClick={handleCreate}>
                        Create MIT
                    </button>
                </div>
            </div>

            <div className="grid-mit-cards p-6 overflow-y-auto flex-1 custom-scrollbar">
                {viewMode === 'HISTORY' ? (
                    // History View - Grouped
                    (() => {
                        const groups = groupItemsByWeek(mits, 'updatedAt');
                        // Use keys as they are generated in order from sorted list, or sort if needed.
                        // Since DB returns sorted DESC, we expect keys to be roughly in order. 
                        // But let's verify via Object.keys.
                        return Object.keys(groups).map(weekLabel => (
                            <div key={weekLabel} className="col-span-full mb-2">
                                <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3 mt-4 border-b border-[hsl(var(--color-border))] pb-1">
                                    {weekLabel}
                                </h3>
                                <div className="grid-mit-cards">
                                    {groups[weekLabel].map(mit => renderMitCard(mit))}
                                </div>
                            </div>
                        ));
                    })()
                ) : (
                    // Pending View - Flat
                    mits.map(mit => renderMitCard(mit))
                )}
            </div>

            {mits.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-muted opacity-50 border-2 border-dashed border-base-300 rounded-xl m-4">
                    <div className="text-6xl mb-6">{viewMode === 'HISTORY' ? '📜' : '🎯'}</div>
                    <p className="text-xl font-medium">{viewMode === 'HISTORY' ? 'No completed MITs found.' : 'No MITs defined yet.'}</p>
                    {viewMode === 'PENDING' && (
                        <>
                            <p className="text-sm mt-2">What is the one thing you MUST do today?</p>
                            <button className="btn btn-outline mt-6" onClick={handleCreate}>Set Intentions</button>
                        </>
                    )}
                </div>
            )}

            {/* Admin Task Bar (Only in Pending View) */}
            {viewMode === 'PENDING' && (
                <AdminTaskBar
                    tasks={adminTasks}
                    history={adminHistory}
                    opportunities={opportunities}
                    relationships={relationships}
                    onCreate={handleCreateAdminTask}
                    onComplete={handleCompleteAdminTask}
                    onUpdate={handleUpdateAdminTask}
                    onDelete={handleDeleteAdminTask}
                />
            )}
        </div>
    );
}
