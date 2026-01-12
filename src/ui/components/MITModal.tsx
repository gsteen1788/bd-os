import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { taskRepository, opportunityRepository, protemoiRepository, contactRepository } from "../../infrastructure/repositories";
import { Task, UUID, TaskLink, Opportunity, ProtemoiEntry, Contact } from "../../domain/entities";
import { TaskType, TaskStatus, EntityType } from "../../domain/enums";

interface MITModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: () => void;
    linkedEntityType?: EntityType;
    linkedEntityId?: UUID | null;
    initialTask?: Task;
}

export function MITModal({ isOpen, onClose, onSave, linkedEntityType, linkedEntityId, initialTask }: MITModalProps) {
    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [links, setLinks] = useState<TaskLink[]>([]);

    // Link Picker State
    const [isLinkPickerOpen, setIsLinkPickerOpen] = useState(false);
    // UI state for tabs
    const [pickerType, setPickerType] = useState<"OPPORTUNITY" | "REL_EXTERNAL" | "REL_INTERNAL">("OPPORTUNITY");

    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [relationships, setRelationships] = useState<{ entry: ProtemoiEntry, contact: Contact }[]>([]);

    // BIG Framework State
    const [bigImpact, setBigImpact] = useState({ active: false, text: "" });
    const [inControl, setInControl] = useState({ active: false, text: "" });
    const [growthOriented, setGrowthOriented] = useState({ active: false, text: "" });

    // Synchronization Effect
    useEffect(() => {
        if (isOpen) {
            if (initialTask) {
                // Editing mode
                setTitle(initialTask.title);
                setDueDate(initialTask.dueDate || new Date().toISOString().split('T')[0]);
                setBigImpact({ active: !!initialTask.bigImpactDescription, text: initialTask.bigImpactDescription || "" });
                setInControl({ active: !!initialTask.inControlDescription, text: initialTask.inControlDescription || "" });
                setGrowthOriented({ active: !!initialTask.growthOrientedDescription, text: initialTask.growthOrientedDescription || "" });
                setLinks(initialTask.links || []);
            } else {
                // Creation mode - reset
                setTitle("");
                setDueDate(new Date().toISOString().split('T')[0]);
                setBigImpact({ active: false, text: "" });
                setInControl({ active: false, text: "" });
                setGrowthOriented({ active: false, text: "" });

                // Pre-fill link from context if provided
                if (linkedEntityType && linkedEntityId) {
                    setLinks([{
                        id: crypto.randomUUID(),
                        taskId: "", // Temp
                        entityType: linkedEntityType,
                        entityId: linkedEntityId,
                        createdAt: new Date().toISOString()
                    }]);
                } else {
                    setLinks([]);
                }
            }
            // Load candidates
            loadCandidates();
        }
    }, [isOpen, initialTask, linkedEntityType, linkedEntityId]);

    const loadCandidates = async () => {
        try {
            const opps = await opportunityRepository.findAll();
            setOpportunities(opps);

            const protemoi = await protemoiRepository.findAll();
            const contacts = await contactRepository.findAll();

            // Join relationship with contact/org name
            const rels = protemoi.map(p => {
                const contact = contacts.find(c => c.id === p.contactId);
                return contact ? { entry: p, contact } : null;
            }).filter(Boolean) as { entry: ProtemoiEntry, contact: Contact }[];

            setRelationships(rels);
        } catch (e) {
            console.error("Failed to load link candidates", e);
        }
    };

    const isValid =
        title.trim().length > 0 &&
        bigImpact.active && bigImpact.text.trim().length > 0 &&
        inControl.active && inControl.text.trim().length > 0 &&
        growthOriented.active && growthOriented.text.trim().length > 0;

    const handleSave = async () => {
        if (!isValid) return;

        try {
            const taskId = initialTask?.id || crypto.randomUUID();
            const taskToSave: Task = {
                id: taskId,
                title,
                status: initialTask?.status || "TODO",
                type: "MIT",
                dueDate,

                // Legacy fields (First link or null)
                linkedEntityType: links.length > 0 ? links[0].entityType : "NONE",
                linkedEntityId: links.length > 0 ? links[0].entityId : null,

                links: links.map(l => ({ ...l, taskId })), // Ensure taskId is set

                bigImpactDescription: bigImpact.text,
                inControlDescription: inControl.text,
                growthOrientedDescription: growthOriented.text,

                createdAt: initialTask?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await taskRepository.save(taskToSave);

            if (onSave) onSave();
            onClose();
        } catch (e) {
            console.error("Failed to save MIT:", e);
            alert("Failed to save MIT");
        }
    };

    const handleDelete = async () => {
        if (!initialTask) return;
        if (!confirm("Delete this MIT?")) return;

        try {
            await taskRepository.delete(initialTask.id);
            if (onSave) onSave();
            onClose();
        } catch (e) {
            console.error("Failed to delete MIT:", e);
            alert("Failed to delete MIT");
        }
    };

    const addLink = (type: EntityType, id: UUID) => {
        // Prevent duplicates
        if (links.some(l => l.entityType === type && l.entityId === id)) return;

        setLinks([...links, {
            id: crypto.randomUUID(),
            taskId: initialTask?.id || "",
            entityType: type,
            entityId: id,
            createdAt: new Date().toISOString()
        }]);
        setIsLinkPickerOpen(false);
    };

    const removeLink = (index: number) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const getLinkName = (link: TaskLink) => {
        if (link.entityType === 'OPPORTUNITY') {
            const opp = opportunities.find(o => o.id === link.entityId);
            return opp ? opp.name : 'Unknown Opportunity';
        } else if (link.entityType === 'RELATIONSHIP') {
            const rel = relationships.find(r => r.entry.id === link.entityId);
            return rel ? rel.contact.displayName : 'Unknown Relationship';
        }
        return link.entityType;
    };

    const toggleChip = (
        state: { active: boolean, text: string },
        setter: (val: { active: boolean, text: string }) => void
    ) => {
        setter({ ...state, active: !state.active });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialTask ? "Edit MIT" : "Create Most Important Task (MIT)"}
            footer={
                <>
                    {initialTask && (
                        <button className="btn btn-ghost text-error" onClick={handleDelete} style={{ marginRight: 'auto' }}>
                            Delete
                        </button>
                    )}
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button
                        className="btn"
                        onClick={handleSave}
                        disabled={!isValid}
                        title={!isValid ? "Complete all B.I.G. sections to save" : "Save MIT"}
                    >
                        {initialTask ? "Save Changes" : "Save MIT"}
                    </button>
                </>
            }
        >
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-muted uppercase tracking-wide">Task</label>
                    <input
                        className="input font-semibold text-lg"
                        placeholder="What is the one thing you must do?"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-muted uppercase tracking-wide">Due Date</label>
                        <input
                            className="input"
                            type="date"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2 relative">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-muted uppercase tracking-wide">Linked Context</label>
                            <button className="btn btn-xs btn-ghost text-primary" onClick={() => setIsLinkPickerOpen(!isLinkPickerOpen)}>+ Add Link</button>
                        </div>

                        <div className="flex flex-col gap-1 min-h-[3rem] p-2 bg-base-200 rounded border border-white/5">
                            {links.length === 0 && <span className="text-xs text-muted italic p-1">No links</span>}
                            {links.map((link, i) => (
                                <div key={i} className="badge badge-outline gap-1 w-full justify-start pl-1 pr-1">
                                    <span className="opacity-50 text-[10px] uppercase font-bold w-4 text-center">{link.entityType[0]}</span>
                                    <span className="truncate text-xs flex-1">{getLinkName(link)}</span>
                                    <button onClick={() => removeLink(i)} className="btn btn-ghost btn-xs btn-circle h-4 w-4 min-h-0">×</button>
                                </div>
                            ))}
                        </div>

                        {/* Dropdown Picker - Apple Style Segmented Control */}
                        {isLinkPickerOpen && (
                            <div className="absolute top-8 right-0 w-80 bg-base-100 border border-white/10 shadow-2xl rounded-xl z-50 p-3 flex flex-col gap-3 max-h-80 overflow-y-auto">

                                {/* Segmented Control Container */}
                                <div className="flex p-1 bg-base-300/50 rounded-lg backdrop-blur-sm">
                                    <button
                                        className={`flex-1 py-1 text-xs font-medium rounded-md transition-all duration-200 ${pickerType === 'OPPORTUNITY'
                                                ? 'shadow-md'
                                                : 'text-base-content/60 hover:text-base-content hover:bg-base-100/10'
                                            }`}
                                        style={pickerType === 'OPPORTUNITY' ? { backgroundColor: 'hsl(var(--color-primary))', color: 'white' } : {}}
                                        onClick={() => setPickerType('OPPORTUNITY')}
                                    >
                                        Opportunities
                                    </button>
                                    <button
                                        className={`flex-1 py-1 text-xs font-medium rounded-md transition-all duration-200 ${pickerType === 'REL_EXTERNAL'
                                                ? 'shadow-md'
                                                : 'text-base-content/60 hover:text-base-content hover:bg-base-100/10'
                                            }`}
                                        style={pickerType === 'REL_EXTERNAL' ? { backgroundColor: 'hsl(var(--color-primary))', color: 'white' } : {}}
                                        onClick={() => setPickerType('REL_EXTERNAL')}
                                    >
                                        Ext. Rels
                                    </button>
                                    <button
                                        className={`flex-1 py-1 text-xs font-medium rounded-md transition-all duration-200 ${pickerType === 'REL_INTERNAL'
                                                ? 'shadow-md'
                                                : 'text-base-content/60 hover:text-base-content hover:bg-base-100/10'
                                            }`}
                                        style={pickerType === 'REL_INTERNAL' ? { backgroundColor: 'hsl(var(--color-primary))', color: 'white' } : {}}
                                        onClick={() => setPickerType('REL_INTERNAL')}
                                    >
                                        Int. Rels
                                    </button>
                                </div>

                                <div className="flex flex-col gap-1">
                                    {pickerType === 'OPPORTUNITY' && (
                                        <>
                                            {opportunities.length === 0 && <span className="text-xs text-muted p-2 italic text-center text-opacity-50">No opportunities found</span>}
                                            {opportunities.map(o => (
                                                <button key={o.id} className="btn btn-ghost btn-sm justify-start text-xs truncate font-normal h-9 min-h-0 px-2 hover:bg-base-200 rounded-md" onClick={() => addLink('OPPORTUNITY', o.id)}>
                                                    <span className="w-2 h-2 rounded-full bg-blue-400 mr-2 opacity-70"></span>
                                                    {o.name}
                                                </button>
                                            ))}
                                        </>
                                    )}

                                    {pickerType === 'REL_EXTERNAL' && (
                                        <>
                                            {relationships.filter(r => !r.entry.isInternal).length === 0 && <span className="text-xs text-muted p-2 italic text-center text-opacity-50">No external relationships</span>}
                                            {relationships.filter(r => !r.entry.isInternal).map(r => (
                                                <button key={r.entry.id} className="btn btn-ghost btn-sm justify-start text-xs truncate font-normal h-9 min-h-0 px-2 hover:bg-base-200 rounded-md" onClick={() => addLink('RELATIONSHIP', r.entry.id)}>
                                                    <span className="w-2 h-2 rounded-full bg-orange-400 mr-2 opacity-70"></span>
                                                    {r.contact.displayName}
                                                </button>
                                            ))}
                                        </>
                                    )}

                                    {pickerType === 'REL_INTERNAL' && (
                                        <>
                                            {relationships.filter(r => r.entry.isInternal).length === 0 && <span className="text-xs text-muted p-2 italic text-center text-opacity-50">No team members found</span>}
                                            {relationships.filter(r => r.entry.isInternal).map(r => (
                                                <button key={r.entry.id} className="btn btn-ghost btn-sm justify-start text-xs truncate font-normal h-9 min-h-0 px-2 hover:bg-base-200 rounded-md" onClick={() => addLink('RELATIONSHIP', r.entry.id)}>
                                                    <span className="w-2 h-2 rounded-full bg-purple-400 mr-2 opacity-70"></span>
                                                    {r.contact.displayName}
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                        {isLinkPickerOpen && <div className="fixed inset-0 z-40" onClick={() => setIsLinkPickerOpen(false)}></div>}
                    </div>
                </div>

                <div className="flex flex-col gap-4 p-4 bg-base-200 rounded-lg border border-white/5">
                    <h4 className="m-0 text-sm font-bold text-primary uppercase tracking-wide">The B.I.G. Test</h4>
                    <p className="text-xs text-muted m-0">Does this task verify as a true MIT?</p>

                    <div className="flex flex-col gap-3">
                        {/* Big Impact */}
                        <div className={`p-3 rounded-md border transition-all ${bigImpact.active ? 'bg-base border-primary/30 shadow-sm' : 'border-transparent bg-base-300 opacity-60'}`}>
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleChip(bigImpact, setBigImpact)}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${bigImpact.active ? 'bg-primary text-white' : 'bg-base-100 text-muted'}`}>B</div>
                                <div className="flex-1 font-semibold">Big Impact</div>
                                <div className="text-xs text-muted">{bigImpact.active ? '▼' : '▶'}</div>
                            </div>
                            {bigImpact.active && (
                                <textarea
                                    className="input w-full mt-3 text-sm h-20"
                                    placeholder="Why will this move the needle significantly?"
                                    value={bigImpact.text}
                                    onChange={e => setBigImpact({ ...bigImpact, text: e.target.value })}
                                />
                            )}
                        </div>

                        {/* In Control */}
                        <div className={`p-3 rounded-md border transition-all ${inControl.active ? 'bg-base border-primary/30 shadow-sm' : 'border-transparent bg-base-300 opacity-60'}`}>
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleChip(inControl, setInControl)}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${inControl.active ? 'bg-primary text-white' : 'bg-base-100 text-muted'}`}>I</div>
                                <div className="flex-1 font-semibold">In Your Control</div>
                                <div className="text-xs text-muted">{inControl.active ? '▼' : '▶'}</div>
                            </div>
                            {inControl.active && (
                                <textarea
                                    className="input w-full mt-3 text-sm h-20"
                                    placeholder="Do you have the autonomy to achieve this?"
                                    value={inControl.text}
                                    onChange={e => setInControl({ ...inControl, text: e.target.value })}
                                />
                            )}
                        </div>

                        {/* Growth Oriented */}
                        <div className={`p-3 rounded-md border transition-all ${growthOriented.active ? 'bg-base border-primary/30 shadow-sm' : 'border-transparent bg-base-300 opacity-60'}`}>
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleChip(growthOriented, setGrowthOriented)}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${growthOriented.active ? 'bg-primary text-white' : 'bg-base-100 text-muted'}`}>G</div>
                                <div className="flex-1 font-semibold">Growth Oriented</div>
                                <div className="text-xs text-muted">{growthOriented.active ? '▼' : '▶'}</div>
                            </div>
                            {growthOriented.active && (
                                <textarea
                                    className="input w-full mt-3 text-sm h-20"
                                    placeholder="Does this align with long-term growth?"
                                    value={growthOriented.text}
                                    onChange={e => setGrowthOriented({ ...growthOriented, text: e.target.value })}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
