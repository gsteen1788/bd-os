import { useEffect, useState } from "react";
import { OpportunityStage, Currency } from "../../domain/enums";
import { opportunityRepository, meetingRepository } from "../../infrastructure/repositories";
import { Opportunity, Meeting } from "../../domain/entities";
import { Modal } from "../components/Modal";
import { MITModal } from "../components/MITModal";
import { evaluateOpportunityNextStep, EvaluationResult } from "../../infrastructure/ai/geminiService";
import { EvaluationModal } from "../components/EvaluationModal";

const STAGE_INFO: Record<string, { goal: string; inStage: string; exit: string }> = {
    "LISTEN_AND_LEARN": {
        goal: "Understand their world well enough to name a real problem, stakes, and who cares.",
        inStage: "- You have hypotheses, but not shared clarity.\n- One friendly contact, but no sponsor behavior yet.",
        exit: "- Tight problem statement in client's language.\n- Identified economic buyer and 1–2 key influencers."
    },
    "CREATE_CURIOSITY": {
        goal: "Get them to want to explore with you.",
        inStage: "- Engaged and reacting, but not investing structured time yet.",
        exit: "- Agreement to explore together (workshop, data share).\n- Defined 'what we will explore' and 'who will be involved'."
    },
    "BUILD_EVERYTHING_TOGETHER": {
        goal: "Co-create the answer and reduce perceived risk.",
        inStage: "- Real joint work happening: shaping scope, approach.\n- Iterating with the buyer system.",
        exit: "- Clear scope/outcomes recognized as 'ours'.\n- Named path to approval."
    },
    "GAIN_APPROVAL": {
        goal: "Convert co-creation into a formal yes.",
        inStage: "- Most stakeholders aligned, remaining work is final mechanics.",
        exit: "- Signed SOW, PO, or formal go-ahead.\n- Mobilization date agreed."
    },
    "RETAIN_AND_EXPAND": {
        goal: "Turn delivery into a platform for more work and deeper trust.",
        inStage: "- Work is active or just completed.",
        exit: "- Follow-on pipeline seeded.\n- Strong sponsor behavior: advocacy, introductions."
    }
};

import { FixedTooltip } from "../components/FixedTooltip";

// ... (existing imports)

// Helper for proper list formatting
const renderTooltipContent = (text: string) => {
    return (
        <div className="flex flex-col gap-1">
            {text.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                const isBullet = trimmed.startsWith("- ");
                const content = isBullet ? trimmed.substring(2) : trimmed;

                if (isBullet) {
                    return (
                        <div key={i} className="flex items-start gap-1.5 ">
                            <span className="select-none opacity-50">•</span>
                            <span className="flex-1">{content}</span>
                        </div>
                    );
                }
                return <div key={i} className={`${i > 0 ? "mt-1" : ""}`}>{content}</div>;
            })}
        </div>
    );
};

export function OpportunityBoard() {
    // ... existing state ...
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
    const [showMITModal, setShowMITModal] = useState(false);
    const [linkedMeetings, setLinkedMeetings] = useState<Meeting[]>([]);
    const [isAnonymized, setIsAnonymized] = useState(() => {
        return localStorage.getItem("bdos_anonymize_enabled") === "true";
    });

    // ... (rest of logic) ...
    const toggleAnonymized = (value: boolean) => {
        setIsAnonymized(value);
        localStorage.setItem("bdos_anonymize_enabled", String(value));
    };

    // Evaluation State
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

    const handleEvaluateOpportunityStep = async () => {
        if (!editingOpp || !editingOpp.nextStepText?.trim()) {
            alert("Please enter a next step first.");
            return;
        }

        setShowEvaluationModal(true);
        setIsEvaluating(true);
        setEvaluationResult(null);

        try {
            const result = await evaluateOpportunityNextStep(
                editingOpp.stage,
                editingOpp.primarySponsor || "Unknown",
                editingOpp.nextStepText
            );
            setEvaluationResult(result);
        } catch (error) {
            console.error("Evaluation error:", error);
            // Close modal on error or show error state
            alert("Failed to evaluate. See console.");
            setShowEvaluationModal(false);
        } finally {
            setIsEvaluating(false);
        }
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
            primarySponsor: "",
            obstacle: "",
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
                    const info = STAGE_INFO[stage];

                    return (
                        <div key={stage} style={{
                            minWidth: "280px",
                            backgroundColor: "hsl(var(--color-bg-surface))",
                            borderRadius: "8px",
                            display: "flex",
                            flexDirection: "column"
                        }}>
                            <div style={{ padding: "12px", borderBottom: "1px solid hsl(var(--color-border))" }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 style={{ margin: 0, fontSize: "12px", color: "hsl(var(--color-text-muted))" }}>{stage.replace(/_/g, " ")}</h4>
                                    {info && (
                                        <FixedTooltip content={
                                            <div className="flex flex-col gap-2">
                                                <div>
                                                    <span className="text-xs font-bold uppercase text-primary block mb-0.5">Goal</span>
                                                    <div className="text-xs text-main">{renderTooltipContent(info.goal)}</div>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold uppercase text-info block mb-0.5">You're in this stage when...</span>
                                                    <div className="text-xs text-muted">{renderTooltipContent(info.inStage)}</div>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold uppercase text-success block mb-0.5">Exit Criteria</span>
                                                    <div className="text-xs text-muted">{renderTooltipContent(info.exit)}</div>
                                                </div>
                                            </div>
                                        }>
                                            <span className="cursor-help text-xs opacity-50 hover:opacity-100 flex items-center justify-center w-4 h-4 rounded-full border border-current">i</span>
                                        </FixedTooltip>
                                    )}
                                </div>
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

                            <div className="flex gap-4">
                                <label className="flex flex-col gap-1 flex-1">
                                    <span className="text-xs text-muted">Primary Buyer / Sponsor</span>
                                    <input
                                        className="input w-full"
                                        value={editingOpp.primarySponsor || ""}
                                        onChange={e => setEditingOpp({ ...editingOpp, primarySponsor: e.target.value })}
                                        placeholder="Name of sponsor"
                                    />
                                </label>
                                <label className="flex flex-col gap-1 flex-1">
                                    <span className="text-xs text-muted">Obstacle / Risk</span>
                                    <input
                                        className="input w-full"
                                        value={editingOpp.obstacle || ""}
                                        onChange={e => setEditingOpp({ ...editingOpp, obstacle: e.target.value })}
                                        placeholder="Biggest risk..."
                                    />
                                </label>
                            </div>

                            <label className="flex flex-col gap-1">
                                <span className="text-xs text-muted">Next Step</span>
                                <input
                                    className="input w-full"
                                    value={editingOpp.nextStepText}
                                    onChange={e => setEditingOpp({ ...editingOpp, nextStepText: e.target.value })}
                                    placeholder="Call John on Monday..."
                                />
                                <div className="flex justify-end mt-1">
                                    <button
                                        className="btn btn-xs btn-outline btn-primary gap-1"
                                        onClick={handleEvaluateOpportunityStep}
                                        disabled={!editingOpp.nextStepText}
                                    >
                                        ✨ Evaluate
                                    </button>
                                </div>
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

                    <EvaluationModal
                        isOpen={showEvaluationModal}
                        isLoading={isEvaluating}
                        result={evaluationResult}
                        onClose={() => setShowEvaluationModal(false)}
                        onUseAnyway={() => {
                            setShowEvaluationModal(false);
                        }}
                        onRewrite={() => {
                            setShowEvaluationModal(false);
                            // User can edit the field
                        }}
                    />
                </>
            )}
        </div>
    );
}
