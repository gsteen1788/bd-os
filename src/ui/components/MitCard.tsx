import { memo } from 'react';
import { Task, TaskLink, Opportunity, ProtemoiEntry, Contact } from "../../domain/entities";

interface MitCardProps {
    mit: Task;
    viewMode: "PENDING" | "HISTORY";
    opportunitiesMap: Map<string, Opportunity>;
    relationshipsMap: Map<string, { entry: ProtemoiEntry, contact: Contact }>;
    onEdit: (task: Task) => void;
    onComplete: (task: Task) => void;
    onRevert: (task: Task) => void;
}

export const MitCard = memo(function MitCard({
    mit,
    viewMode,
    opportunitiesMap,
    relationshipsMap,
    onEdit,
    onComplete,
    onRevert
}: MitCardProps) {

    const getLinkDisplay = (link: TaskLink) => {
        if (link.entityType === 'OPPORTUNITY') {
            const opp = opportunitiesMap.get(link.entityId);
            return opp ? opp.name : 'Unknown Opportunity';
        } else if (link.entityType === 'RELATIONSHIP') {
            const rel = relationshipsMap.get(link.entityId);
            return rel ? rel.contact.displayName : 'Unknown Relationship';
        }
        return link.entityType;
    };

    const getLegacyLinkDisplay = (type: string, id: string | null) => {
        if (!id) return type;
        if (type === 'OPPORTUNITY') {
            const opp = opportunitiesMap.get(id);
            return opp ? opp.name : type;
        } else if (type === 'RELATIONSHIP') {
            const rel = relationshipsMap.get(id);
            return rel ? rel.contact.displayName : type;
        }
        return type;
    };

    return (
        <div
            className={`card border border-[hsl(var(--color-border))] hover:border-primary/50 transition-all p-0 flex flex-col gap-0 group hover:shadow-lg hover:shadow-primary/5 cursor-pointer overflow-hidden relative ${viewMode === 'HISTORY' ? 'bg-base-300 opacity-80' : 'bg-base-200'}`}
            onClick={() => onEdit(mit)}
        >
            {/* Card Header */}
            <div className="p-4 pb-2 flex justify-between items-start">
                <span className="text-xs font-mono font-medium opacity-50">{mit.dueDate}</span>
                <div className="flex gap-2 items-center">
                    {/* Complete/Revert Button */}
                    {viewMode === 'PENDING' ? (
                        <button
                            className="btn btn-sm btn-ghost opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-success absolute top-2 right-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                onComplete(mit);
                            }}
                            title="Mark as Complete"
                            aria-label="Mark as Complete"
                        >
                            ✓
                        </button>
                    ) : (
                        <button
                            className="btn btn-sm btn-ghost opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-warning absolute top-2 right-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRevert(mit);
                            }}
                            title="Revert to Pending"
                            aria-label="Revert to Pending"
                        >
                            ↩
                        </button>
                    )}

                    <div className="flex gap-2 mr-8">
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
                <h3>
                    <button
                        className={`text-lg font-bold leading-tight text-left w-full group-hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded px-1 -ml-1 ${viewMode === 'HISTORY' ? 'line-through text-muted' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(mit);
                        }}
                        aria-label={`Edit task: ${mit.title}`}
                    >
                        {mit.title}
                    </button>
                </h3>
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
                    <div className="ml-auto flex items-center gap-2 text-xs text-muted italic">
                        {mit.durationMinutes && (
                            <span className="badge badge-sm badge-ghost font-mono">{mit.durationMinutes}m</span>
                        )}
                        <span>Completed: {new Date(mit.updatedAt).toLocaleDateString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
});
