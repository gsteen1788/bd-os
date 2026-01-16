import { useEffect, useState } from "react";
import { OpportunityStage, Currency } from "../../domain/enums";
import { opportunityRepository, meetingRepository } from "../../infrastructure/repositories";
import { Opportunity, Meeting } from "../../domain/entities";
import { Modal } from "../components/Modal";
import { MITModal } from "../components/MITModal";

export function OpportunityBoard() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
    const [showMITModal, setShowMITModal] = useState(false);
    const [linkedMeetings, setLinkedMeetings] = useState<Meeting[]>([]);
    const [isAnonymized, setIsAnonymized] = useState(() => {
        return localStorage.getItem("bdos_anonymize_enabled") === "true";
    });

    const toggleAnonymized = (value: boolean) => {
        setIsAnonymized(value);
        localStorage.setItem("bdos_anonymize_enabled", String(value));
    };

    useEffect(() => {
        if (editingOpp?.id) {
            meetingRepository.findByOpportunityId(editingOpp.id)
                .then(setLinkedMeetings)
                .catch(err => console.error("Failed to load linked meetings", err));
        } else {
            setLinkedMeetings([]);
        }
    }, [editingOpp?.id]);

    const load = () => {
        opportunityRepository.findAll().then(setOpportunities);
    };

    useEffect(() => {
        load();
    }, []);

    const handleSave = async (opp: Opportunity) => {
        try {
            console.log("Saving opportunity:", opp);
            await opportunityRepository.save(opp);
            setEditingOpp(null);
            load();
        } catch (e) {
            console.error("Save failed:", e);
            alert("Error saving: " + e);
        }
    };

    const handleDelete = async () => {
        if (!editingOpp) return;
        if (!confirm("Are you sure you want to delete this deal? This cannot be undone.")) return;

        try {
            await opportunityRepository.delete(editingOpp.id);
            setEditingOpp(null);
            load();
        } catch (e) {
            alert("Error deleting: " + e);
        }
    };

    const createNew = () => {
        setEditingOpp({
            id: crypto.randomUUID(),
            name: "",
            stage: "CREATE_CURIOSITY",
            status: "OPEN",
            probability: 10,
            valueEstimate: 0,
            currency: "ZAR",
            nextStepText: "",
            organizationId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center h-[70px] px-6 border-b border-white/5 bg-base sticky top-0 z-10">
                <h2 className="text-xl font-semibold m-0 tracking-tight">Pipeline (Opportunities)</h2>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-sm font-medium text-muted">Anonymise</span>
                        <input
                            type="checkbox"
                            className="toggle toggle-primary toggle-sm"
                            checked={isAnonymized}
                            onChange={(e) => toggleAnonymized(e.target.checked)}
                        />
                    </label>
                    <button className="btn btn-primary" onClick={createNew}>New Opportunity</button>
                </div>
            </div>

            <div style={{ display: "flex", gap: "16px", overflowX: "auto", flex: 1, padding: "24px" }}>
                {OpportunityStage.map(stage => {
                    const stageOpps = opportunities.filter(o => o.stage === stage);

                    return (
                        <div key={stage} style={{
                            minWidth: "280px",
                            backgroundColor: "hsl(var(--color-bg-surface))",
                            borderRadius: "8px",
                            display: "flex",
                            flexDirection: "column"
                        }}>
                            <div style={{ padding: "12px", borderBottom: "1px solid hsl(var(--color-border))" }}>
                                <h4 style={{ margin: 0, fontSize: "12px", color: "hsl(var(--color-text-muted))" }}>{stage.replace(/_/g, " ")}</h4>
                                <div style={{ fontWeight: "bold", fontSize: "14px" }}>{stageOpps.length} Deals</div>
                            </div>

                            <div className="flex flex-col gap-2" style={{ padding: "12px", overflowY: "auto", flex: 1 }}>
                                {stageOpps.map(opp => (
                                    <div
                                        key={opp.id}
                                        className="card"
                                        style={{ padding: "12px", border: "1px solid hsl(var(--color-border))", backgroundColor: "hsl(var(--color-bg-base))", cursor: "pointer" }}
                                        onClick={() => setEditingOpp(opp)}
                                    >
                                        <div style={{ fontWeight: "600" }}>
                                            {isAnonymized ? `Opportunity ${opportunities.indexOf(opp) + 1}` : opp.name}
                                        </div>
                                        <div className="flex justify-between items-center" style={{ marginTop: "8px", fontSize: "12px" }}>
                                            <span className="text-muted">
                                                {opp.valueEstimate
                                                    ? `${opp.currency === "USD" ? "$" : opp.currency === "GBP" ? "£" : "R"}${opp.valueEstimate.toLocaleString()}`
                                                    : "Not sized"}
                                            </span>
                                            <span style={{
                                                padding: "2px 6px",
                                                borderRadius: "4px",
                                                backgroundColor: opp.probability && opp.probability > 50 ? "rgba(76, 175, 80, 0.2)" : "rgba(255, 193, 7, 0.2)",
                                                color: opp.probability && opp.probability > 50 ? "#81c784" : "#ffd54f"
                                            }}>
                                                {opp.probability}%
                                            </span>
                                        </div>
                                        {opp.nextStepText && (
                                            <div style={{ marginTop: "8px", fontSize: "11px", color: "hsl(var(--color-text-muted))", borderTop: "1px solid hsl(var(--color-border))", paddingTop: "4px" }}>
                                                Next: {opp.nextStepText}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {editingOpp && (
                <>
                    <Modal
                        isOpen={!!editingOpp}
                        onClose={() => setEditingOpp(null)}
                        title={editingOpp.name ? "Edit Deal" : "New Deal"}
                        footer={
                            <>
                                <button className="btn btn-ghost text-error" onClick={handleDelete} style={{ marginRight: "auto", color: "hsl(var(--color-text-error, #f87171))" }}>Delete</button>
                                <button className="btn btn-ghost" onClick={() => setEditingOpp(null)}>Cancel</button>
                                <button className="btn" onClick={() => handleSave(editingOpp)}>Save</button>
                            </>
                        }
                    >
                        <div className="flex flex-col gap-4">
                            {/* MIT Creation Link */}
                            {editingOpp.id && (
                                <div className="flex justify-end -mt-2">
                                    <button className="btn btn-xs btn-outline" onClick={() => setShowMITModal(true)}>
                                        + Create MIT for this
                                    </button>
                                </div>
                            )}

                            <label className="flex flex-col gap-1">
                                <span className="text-xs text-muted">Deal Name</span>
                                <input
                                    className="input w-full"
                                    value={editingOpp.name}
                                    onChange={e => setEditingOpp({ ...editingOpp, name: e.target.value })}
                                    placeholder="Acme Corp Contract"
                                    autoFocus
                                />
                            </label>
                            <div className="flex gap-4">
                                <label className="flex flex-col gap-1 w-24">
                                    <span className="text-xs text-muted">Currency</span>
                                    <select
                                        className="input w-full"
                                        value={editingOpp.currency || "ZAR"}
                                        onChange={e => setEditingOpp({ ...editingOpp, currency: e.target.value as Currency })}
                                    >
                                        {Currency.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-1 flex-1">
                                    <span className="text-xs text-muted">Value Estimate</span>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={editingOpp.valueEstimate || ""}
                                        onChange={e => {
                                            const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                                            setEditingOpp({ ...editingOpp, valueEstimate: val });
                                        }}
                                        placeholder="0"
                                    />
                                </label>
                                <label className="flex flex-col gap-1 flex-1">
                                    <span className="text-xs text-muted">Probability (%)</span>
                                    <input
                                        type="number"
                                        className="input w-full"
                                        value={editingOpp.probability || ""}
                                        onChange={e => setEditingOpp({ ...editingOpp, probability: Number(e.target.value) })}
                                        placeholder="0"
                                        min="0"
                                        max="100"
                                    />
                                </label>
                            </div>
                            <label className="flex flex-col gap-1">
                                <span className="text-xs text-muted">Stage</span>
                                <select
                                    className="input w-full"
                                    value={editingOpp.stage}
                                    onChange={e => setEditingOpp({ ...editingOpp, stage: e.target.value as any })}
                                    style={{
                                        backgroundColor: "hsl(var(--color-bg-base))",
                                        border: "1px solid hsl(var(--color-border))",
                                        color: "hsl(var(--color-text-main))",
                                        padding: "8px 12px",
                                        borderRadius: "4px"
                                    }}
                                >
                                    {OpportunityStage.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-xs text-muted">Next Step</span>
                                <input
                                    className="input w-full"
                                    value={editingOpp.nextStepText}
                                    onChange={e => setEditingOpp({ ...editingOpp, nextStepText: e.target.value })}
                                    placeholder="Call John on Monday..."
                                />
                            </label>

                            {/* Connected Meetings Section */}
                            <div className="border-t border-base-200 pt-4 mt-2">
                                <details className="collapse collapse-arrow bg-base-200">
                                    <summary className="collapse-title text-sm font-medium">Connected Meetings ({linkedMeetings.length})</summary>
                                    <div className="collapse-content">
                                        <div className="flex flex-col gap-2 pt-2">
                                            {linkedMeetings.map(m => (
                                                <div key={m.id} className="text-xs p-2 bg-base-100 rounded flex justify-between items-center bg-opacity-50">
                                                    <div>
                                                        <div className="font-bold">{m.title}</div>
                                                        <div className="text-muted">{new Date(m.startAt!).toLocaleDateString()}</div>
                                                    </div>
                                                    <span className={`badge badge-xs ${m.status === "COMPLETED" ? "badge-success" : "badge-ghost"}`}>{m.status}</span>
                                                </div>
                                            ))}
                                            {linkedMeetings.length === 0 && (
                                                <div className="text-xs text-muted text-center py-2">No linked meetings</div>
                                            )}
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </Modal>

                    {/* MIT Modal must be LAST to appear ON TOP */}
                    <MITModal
                        isOpen={showMITModal}
                        onClose={() => setShowMITModal(false)}
                        linkedEntityType="OPPORTUNITY"
                        linkedEntityId={editingOpp.id}
                    />
                </>
            )}
        </div>
    );
}
