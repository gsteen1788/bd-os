import { useEffect, useState } from "react";
import { Task } from "../../domain/entities";
import { taskRepository } from "../../infrastructure/repositories";
import { MITModal } from "../components/MITModal";

export function Dashboard() {
    const [mits, setMits] = useState<Task[]>([]);
    const [showMITModal, setShowMITModal] = useState(false);
    const [editingMIT, setEditingMIT] = useState<Task | undefined>(undefined);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        taskRepository.findPending().then(tasks => {
            setMits(tasks.filter(t => t.type === 'MIT'));
        });
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
                    <h2 className="text-2xl font-bold text-white m-0">🔥 Most Important Tasks</h2>
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
                        className="card bg-base-200 border border-white/5 hover:border-primary/50 transition-all p-5 flex flex-col gap-4 group hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
                        onClick={() => handleEdit(mit)}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-mono bg-base-300 px-2 py-1 rounded text-muted">{mit.dueDate}</span>
                            <div className="flex gap-1">
                                <div className="badge badge-sm badge-success font-bold" title={mit.bigImpactDescription || 'Big Impact'}>B</div>
                                <div className="badge badge-sm badge-success font-bold" title={mit.inControlDescription || 'In Control'}>I</div>
                                <div className="badge badge-sm badge-success font-bold" title={mit.growthOrientedDescription || 'Growth Oriented'}>G</div>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">{mit.title}</h3>

                        <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-2">
                            {mit.bigImpactDescription && (
                                <p className="text-xs text-muted line-clamp-2 italic">"<span className="font-bold mr-1">B:</span> {mit.bigImpactDescription}"</p>
                            )}
                            {mit.inControlDescription && (
                                <p className="text-xs text-muted line-clamp-2 italic">"<span className="font-bold mr-1">I:</span> {mit.inControlDescription}"</p>
                            )}
                            {mit.growthOrientedDescription && (
                                <p className="text-xs text-muted line-clamp-2 italic">"<span className="font-bold mr-1">G:</span> {mit.growthOrientedDescription}"</p>
                            )}

                            {mit.links && mit.links.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {mit.links.map((link, i) => (
                                        <span key={i} className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded">
                                            {link.entityType}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {(!mit.links || mit.links.length === 0) && mit.linkedEntityType !== "NONE" && (
                                <div className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded w-fit">
                                    {mit.linkedEntityType}
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
