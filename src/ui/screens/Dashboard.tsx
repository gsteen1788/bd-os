import { useEffect, useState } from "react";
import { Task, TaskLink, Opportunity, ProtemoiEntry, Contact } from "../../domain/entities";
import { taskRepository, opportunityRepository, protemoiRepository, contactRepository } from "../../infrastructure/repositories";
import { MITModal } from "../components/MITModal";

export function Dashboard() {
    const [mits, setMits] = useState<Task[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [relationships, setRelationships] = useState<{ entry: ProtemoiEntry, contact: Contact }[]>([]);

    const [showMITModal, setShowMITModal] = useState(false);
    const [editingMIT, setEditingMIT] = useState<Task | undefined>(undefined);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [tasks, opps, protemoi, contacts] = await Promise.all([
                taskRepository.findPending(),
                opportunityRepository.findAll(),
                protemoiRepository.findAll(),
                contactRepository.findAll()
            ]);

            setMits(tasks.filter(t => t.type === 'MIT'));
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

    const getLinkColor = (link: TaskLink) => {
        if (link.entityType === 'OPPORTUNITY') return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
        if (link.entityType === 'RELATIONSHIP') return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
        return 'text-primary bg-primary/10 border-primary/20';
    };

    // Helper for legacy single link
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

    return (
        <div className="flex flex-col gap-4 h-full p-4">
            <MITModal
                isOpen={showMITModal}
                onClose={handleModalClose}
                onSave={loadData}
                initialTask={editingMIT}
            />

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-main m-0">🔥 Most Important Tasks</h2>
                    <p className="text-muted text-sm mt-1">Focus on the things that really matter today.</p>
                </div>
                <button className="btn btn-primary gap-2" onClick={handleCreate}>
                    <span>+</span> Create MIT
                </button>
            </div>

            <div className="grid-mit-cards mt-4">
                {mits.map(mit => (
                    <div
                        key={mit.id}
                        className="card bg-base-200 border border-white/5 hover:border-primary/50 transition-all p-0 flex flex-col gap-0 group hover:shadow-lg hover:shadow-primary/5 cursor-pointer overflow-hidden"
                        onClick={() => handleEdit(mit)}
                    >
                        {/* Card Header */}
                        <div className="p-4 pb-2 flex justify-between items-start">
                            <span className="text-xs font-mono font-medium opacity-50">{mit.dueDate}</span>
                            <div className="flex gap-2">
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

                        {/* Title */}
                        <div className="px-4 pb-4">
                            <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">{mit.title}</h3>
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
                        <div className="mt-auto p-3 bg-black/20 border-t border-white/5 flex flex-wrap gap-2">
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
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-base-100 rounded border border-white/5 max-w-full">
                                    <span className="text-[10px] opacity-60 uppercase font-bold">{mit.linkedEntityType[0]}</span>
                                    <span className="truncate text-[10px] opacity-80">{getLegacyLinkDisplay(mit.linkedEntityType, mit.linkedEntityId || null)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {mits.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-muted opacity-50 border-2 border-dashed border-base-300 rounded-xl m-4">
                    <div className="text-6xl mb-6">🎯</div>
                    <p className="text-xl font-medium">No MITs defined yet.</p>
                    <p className="text-sm mt-2">What is the one thing you MUST do today?</p>
                    <button className="btn btn-outline mt-6" onClick={handleCreate}>Set Intentions</button>
                </div>
            )}
        </div>
    );
}
