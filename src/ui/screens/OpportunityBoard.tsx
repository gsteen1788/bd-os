import { useEffect, useState, useMemo, useRef } from "react";
import { OpportunityStage, Currency } from "../../domain/enums";
import { opportunityRepository, meetingRepository, organizationRepository } from "../../infrastructure/repositories";
import { Opportunity, Meeting, Organization } from "../../domain/entities";
import { Modal } from "../components/Modal";
import { MITModal } from "../components/MITModal";
import { evaluateOpportunityNextStep, EvaluationResult } from "../../infrastructure/ai/geminiService";
import { EvaluationModal } from "../components/EvaluationModal";
import { formatDate } from "../../utils/dateUtils";

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
    "ONGOING_PROJECT": {
        goal: "Successfully deliver the agreed scope and build client trust.",
        inStage: "- Active project delivery phase.\n- Regular interactions with the client team.",
        exit: "- Project completed and final deliverables accepted."
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

import { open } from "@tauri-apps/api/dialog";
import { convertFileSrc } from "@tauri-apps/api/tauri";

export function OpportunityBoard() {
    // ... existing state ...
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
    const [showMITModal, setShowMITModal] = useState(false);
    const [dragOverStage, setDragOverStage] = useState<string | null>(null);
    const isDragging = useRef(false);
    const [linkedMeetings, setLinkedMeetings] = useState<Meeting[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [showNewOrgInput, setShowNewOrgInput] = useState(false);
    const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
    const [newOrgName, setNewOrgName] = useState("");
    const [newOrgLogo, setNewOrgLogo] = useState("");
    
    const [isAnonymized, setIsAnonymized] = useState(() => {
        return localStorage.getItem("bdos_anonymize_enabled") === "true";
    });

    // ... (rest of logic) ...
    const toggleAnonymized = (value: boolean) => {
        setIsAnonymized(value);
        localStorage.setItem("bdos_anonymize_enabled", String(value));
    };

    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(() => ({
        ZAR: 1.0,
        GBP: Number(localStorage.getItem('exchange_rate_gbp') || 24.0),
        USD: Number(localStorage.getItem('exchange_rate_usd') || 19.0),
    }));

    useEffect(() => {
        const handleRatesUpdated = () => {
            setExchangeRates({
                ZAR: 1.0,
                GBP: Number(localStorage.getItem('exchange_rate_gbp') || 24.0),
                USD: Number(localStorage.getItem('exchange_rate_usd') || 19.0),
            });
        };
        window.addEventListener('exchange_rates_updated', handleRatesUpdated);
        return () => window.removeEventListener('exchange_rates_updated', handleRatesUpdated);
    }, []);

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
        // Optimization: Bolt ⚡ - Fetch lightweight summaries instead of full entities (O(N) memory reduction).
        // Avoids loading large text fields (e.g. descriptionMd) for all opportunities on the board.
        // Batch independent promises to synchronize state updates and minimize re-renders
        Promise.all([
            opportunityRepository.findAllSummaries(),
            organizationRepository.findAllSummaries()
        ]).then(([opps, orgs]) => {
            setOpportunities(opps);
            setOrganizations(orgs);
        });
    };

    useEffect(() => {
        load();
    }, []);

    // Optimization: Bolt ⚡ - Pre-calculate global index map for opportunities
    // Reduces algorithmic complexity of generating anonymized labels from O(N^2) to O(N) during render cycles.
    const opportunitiesIndexMap = useMemo(() => {
        const map = new Map<string, number>();
        opportunities.forEach((opp, index) => {
            map.set(opp.id, index);
        });
        return map;
    }, [opportunities]);

    // Optimization: Bolt ⚡ - Pre-calculate global index map for organizations
    // Reduces algorithmic complexity of generating anonymized labels from O(N*M) to O(N+M) during render cycles.
    const organizationsIndexMap = useMemo(() => {
        const map = new Map<string, number>();
        organizations.forEach((org, index) => {
            map.set(org.id, index);
        });
        return map;
    }, [organizations]);

    const organizationsMap = useMemo(() => {
        const map = new Map<string, Organization>();
        organizations.forEach((org) => {
            map.set(org.id, org);
        });
        return map;
    }, [organizations]);

    // Optimization: Bolt ⚡ - Pre-group opportunities by stage to avoid O(S * E) loop filtering
    const oppsByStage = useMemo(() => {
        const map = new Map<string, Opportunity[]>();
        for (const opp of opportunities) {
            const list = map.get(opp.stage) || [];
            list.push(opp);
            map.set(opp.stage, list);
        }
        return map;
    }, [opportunities]);

    const handleSaveOrganization = async () => {
        if (!newOrgName.trim()) {
            alert("Please enter a company name");
            return;
        }

        try {
            if (editingOrgId) {
                const existing = organizations.find(o => o.id === editingOrgId);
                if (!existing) return;
                const fullOrg = await organizationRepository.findById(editingOrgId) || existing;
                const updatedOrg: Organization = {
                    ...fullOrg,
                    name: newOrgName,
                    logoUrl: newOrgLogo || null,
                    updatedAt: new Date().toISOString()
                };
                await organizationRepository.save(updatedOrg);
                setOrganizations(prev => prev.map(o => o.id === editingOrgId ? updatedOrg : o));
            } else {
                const newOrgId = crypto.randomUUID();
                const newOrg: Organization = {
                    id: newOrgId,
                    name: newOrgName,
                    logoUrl: newOrgLogo || null,
                    notesMd: "",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                await organizationRepository.save(newOrg);
                setOrganizations(prev => [newOrg, ...prev]);
                setEditingOpp(prev => prev ? { ...prev, organizationId: newOrgId } : null);
            }
            setNewOrgName("");
            setNewOrgLogo("");
            setEditingOrgId(null);
            setShowNewOrgInput(false);
        } catch (e) {
            console.error("Failed to save organization:", e);
            alert("Failed to save company");
        }
    };

    const handleDeleteOrganization = async () => {
        if (!editingOrgId) return;
        if (!confirm("Delete this company? This cannot be undone.")) return;

        try {
            await organizationRepository.delete(editingOrgId);
            setOrganizations(prev => prev.filter(o => o.id !== editingOrgId));
            if (editingOpp?.organizationId === editingOrgId) {
                setEditingOpp({ ...editingOpp, organizationId: null });
            }
            setNewOrgName("");
            setNewOrgLogo("");
            setEditingOrgId(null);
            setShowNewOrgInput(false);
        } catch (e) {
            console.error("Failed to delete org:", e);
            alert("Failed to delete company (check console)");
        }
    };

    const startEditingOrg = () => {
        const orgId = editingOpp?.organizationId;
        if (!orgId) return;
        const org = organizations.find(o => o.id === orgId);
        if (!org) return;

        setEditingOrgId(org.id);
        setNewOrgName(org.name);
        setNewOrgLogo(org.logoUrl || "");
        setShowNewOrgInput(true);
    };

    const handleSelectLogo = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{ name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'svg', 'webp'] }]
            });
            if (selected && typeof selected === 'string') {
                setNewOrgLogo(selected);
            }
        } catch (e) {
            console.error("File selection failed", e);
        }
    };

    const renderLogoSrc = (url: string) => {
        if (!url) return "";
        if (url.startsWith('http')) return url;
        try {
            return convertFileSrc(url);
        } catch (e) {
            return url;
        }
    };

    const handleSave = async (opp: Opportunity) => {
        try {
            console.log("Saving opportunity ID:", opp.id);
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

    // Dynamic exchange rate baseline for aggregate pipeline valuation
    // Loaded from global settings/localStorage via component state

    // Optimization: Bolt ⚡ - Wrap totalOppSize calculation in useMemo to prevent O(N) array reduction
    // from recalculating on every render cycle (e.g. when typing in unrelated inputs).
    const totalOppSize = useMemo(() => {
        return opportunities.reduce((sum, opp) => {
            const rawVal = opp.valueEstimate || 0;
            const prob = opp.probability || 0;
            const currency = opp.currency || "ZAR";

            const rate = exchangeRates[currency] || 1.0;
            const convertedVal = rawVal * rate;

            return sum + (convertedVal * (prob / 100));
        }, 0);
    }, [opportunities, exchangeRates]);

    const handleDropOpportunity = async (oppId: string, newStage: string) => {
        const opp = opportunities.find(o => o.id === oppId);
        if (!opp) return;
        if (opp.stage === newStage) return;

        // Optimistic update
        setOpportunities(prev => prev.map(o => o.id === oppId ? { 
            ...o, 
            stage: newStage as any, 
            probability: newStage === "ONGOING_PROJECT" ? 100 : o.probability 
        } : o));

        try {
            const fullOpp = await opportunityRepository.findById(oppId);
            if (fullOpp) {
                const updated = { 
                    ...fullOpp, 
                    stage: newStage as any, 
                    probability: newStage === "ONGOING_PROJECT" ? 100 : fullOpp.probability 
                };
                await opportunityRepository.save(updated);
                load(); // Reload to refresh summaries fully
            }
        } catch (e) {
            console.error("Failed to move opportunity", e);
            alert("Failed to move opportunity");
            load(); // Revert on error
        }
    };

    const renderStageColumn = (stage: string) => {
        const stageOpps = oppsByStage.get(stage) || [];
        const info = STAGE_INFO[stage];

        return (
            <div 
                key={stage} 
                style={{
                    minWidth: "280px",
                    backgroundColor: "hsl(var(--color-bg-surface))",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    flexShrink: 0,
                    transition: "box-shadow 0.2s, outline 0.2s",
                    outline: dragOverStage === stage ? "2px solid hsl(var(--color-primary))" : "2px solid transparent",
                    boxShadow: dragOverStage === stage ? "0 0 16px hsla(var(--color-primary), 0.3)" : "none"
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setDragOverStage(stage);
                }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOverStage(null);
                    const oppId = e.dataTransfer.getData("text/plain");
                    if (oppId) {
                        handleDropOpportunity(oppId, stage);
                    }
                }}
            >
                <div style={{ padding: "12px", borderBottom: "1px solid hsl(var(--color-border))" }}>
                    <div className="flex items-center gap-2 mb-1">
                        <h4 style={{ margin: 0, fontSize: "12px", color: "hsl(var(--color-text-muted))" }}>{stage.replace(/_/g, " ")}</h4>
                        {info && (
                            <FixedTooltip
                                ariaLabel="Stage Information"
                                content={
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
                    {stageOpps.length === 0 && (
                        <div className="flex items-center justify-center h-24 border-2 border-dashed border-[hsl(var(--color-border))] rounded-lg text-muted text-sm" style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                            Drop opportunity here
                        </div>
                    )}
                    {stageOpps.map(opp => (
                        <button
                            key={opp.id}
                            type="button"
                            draggable
                            onDragStart={(e) => {
                                isDragging.current = true;
                                e.dataTransfer.setData("text/plain", opp.id);
                                e.dataTransfer.effectAllowed = "move";
                            }}
                            onDragEnd={() => {
                                setDragOverStage(null);
                                setTimeout(() => { isDragging.current = false; }, 0);
                            }}
                            className="card w-full text-left p-3 bg-base-100 hover:bg-base-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none cursor-grab active:cursor-grabbing"
                            onClick={async () => {
                                if (isDragging.current) return;
                                try {
                                    // Optimization: Bolt ⚡ - O(1) fetch for full entity only when editing.
                                    // Prevents data loss by ensuring we don't save a summary object over a full record.
                                    const fullOpp = await opportunityRepository.findById(opp.id);
                                    if (fullOpp) {
                                        setEditingOpp(fullOpp);
                                    } else {
                                        console.error("Opportunity not found in database.");
                                        alert("Failed to load opportunity details.");
                                    }
                                } catch (e) {
                                    console.error("Failed to load full opportunity", e);
                                    alert("Failed to load opportunity details.");
                                }
                            }}
                        >
                            {opp.organizationId && organizationsMap.get(opp.organizationId)?.logoUrl && !isAnonymized && (
                                <div
                                    className="mb-8 rounded p-0 overflow-hidden flex items-start justify-start z-10 transition-transform hover:scale-105"
                                    style={{ width: '128px', height: 'auto', marginBottom: '10px' }}
                                    title={organizationsMap.get(opp.organizationId)!.name}
                                >
                                    <img
                                        src={renderLogoSrc(organizationsMap.get(opp.organizationId)!.logoUrl!)}
                                        alt={organizationsMap.get(opp.organizationId)!.name}
                                        className="object-contain"
                                        style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                </div>
                            )}
                            <div className="text-xs uppercase tracking-wide opacity-80 mb-1">
                                {opp.organizationId && organizationsMap.get(opp.organizationId)?.name ? (
                                    <div className="font-semibold truncate text-muted" title={isAnonymized ? "Anonymized Organization" : organizationsMap.get(opp.organizationId)!.name}>
                                        {isAnonymized ? `Organization ${(organizationsIndexMap.get(opp.organizationId) ?? -1) + 1}` : organizationsMap.get(opp.organizationId)!.name}
                                    </div>
                                ) : null}
                            </div>
                            <div style={{ fontWeight: "600" }}>
                                {isAnonymized ? `Opportunity ${(opportunitiesIndexMap.get(opp.id) ?? -1) + 1}` : opp.name}
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
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const sellingStages = OpportunityStage.filter(s => s !== "ONGOING_PROJECT");
    const ongoingStage = "ONGOING_PROJECT";

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center h-[70px] px-6 border-b border-[hsl(var(--color-border))] bg-base sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold m-0 tracking-tight">Pipeline (Opportunities)</h2>
                    <div className="flex flex-col">
                        <span className="text-xs text-muted uppercase font-bold tracking-wider">Total Pipeline Value (Risk-Adj)</span>
                        <span className="text-lg font-bold text-success">
                            ZAR {totalOppSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <label htmlFor="toggle-anonymise-opps" className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-sm font-medium text-muted">Anonymise</span>
                        <input
                            id="toggle-anonymise-opps"
                            type="checkbox"
                            className="toggle toggle-primary toggle-sm"
                            checked={isAnonymized}
                            onChange={(e) => toggleAnonymized(e.target.checked)}
                        />
                    </label>
                    <button className="btn btn-primary" onClick={createNew}>New Opportunity</button>
                </div>
            </div>

            <div style={{ display: "flex", gap: "16px", padding: "24px", flex: 1, overflowX: "auto", height: "100%" }}>
                <div style={{ display: "flex", gap: "16px", flexShrink: 0 }}>
                    {sellingStages.map(renderStageColumn)}
                </div>

                <div 
                    style={{ 
                        width: "2px", 
                        backgroundColor: "hsl(var(--color-border))", 
                        margin: "0 8px",
                        flexShrink: 0
                    }} 
                />

                <div style={{ display: "flex", gap: "16px", flexShrink: 0 }}>
                    {renderStageColumn(ongoingStage)}
                </div>
            </div>

            {editingOpp && (
                <>
                    <Modal
                        isOpen={!!editingOpp}
                        onClose={() => setEditingOpp(null)}
                        title={editingOpp.name ? "Edit Deal" : "New Deal"}
                        footer={
                            <>
                                <button className="btn btn-ghost text-error focus-visible:ring-2 focus-visible:ring-error focus-visible:outline-none rounded-md" onClick={handleDelete} style={{ marginRight: "auto", color: "hsl(var(--color-text-error, #f87171))" }}>Delete</button>
                                <button className="btn btn-ghost focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-md" onClick={() => setEditingOpp(null)}>Cancel</button>
                                <button className="btn" onClick={() => handleSave(editingOpp)}>Save</button>
                            </>
                        }
                    >
                        <div className="flex flex-col gap-4">
                            {/* MIT Creation Link */}
                            {editingOpp.id && (
                                <div className="flex justify-end -mt-2 mb-2">
                                    <button className="btn btn-xs btn-outline" onClick={() => setShowMITModal(true)}>
                                        + Create MIT for this
                                    </button>
                                </div>
                            )}

                            {/* Organization Selector */}
                            <div className="p-4 bg-base-200 rounded-lg border border-[hsl(var(--color-border))] mb-1">
                                <h4 className="mb-3 font-bold text-base-content text-sm uppercase tracking-wide opacity-70">Company Details</h4>
                                <div className="flex flex-col gap-3">
                                    {!showNewOrgInput ? (
                                        <div className="flex items-end gap-2">
                                            <label htmlFor="opp-org" className="flex flex-col gap-1 flex-1">
                                                <span className="text-xs font-medium text-muted">Organization</span>
                                                <select
                                                    id="opp-org"
                                                    className="input"
                                                    value={editingOpp.organizationId || ""}
                                                    onChange={e => setEditingOpp({
                                                        ...editingOpp,
                                                        organizationId: e.target.value || null
                                                    })}
                                                >
                                                    <option value="">Select Organization...</option>
                                                    {organizations.map(org => (
                                                        <option key={org.id} value={org.id}>{org.name}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <button
                                                className="btn btn-square btn-ghost"
                                                title="Edit Selected Company"
                                                aria-label="Edit Selected Company"
                                                disabled={!editingOpp.organizationId}
                                                onClick={startEditingOrg}
                                            >
                                                ✎
                                            </button>
                                            <button
                                                className="btn btn-square"
                                                title="Add New Company"
                                                aria-label="Add New Company"
                                                onClick={() => {
                                                    setEditingOrgId(null);
                                                    setNewOrgName("");
                                                    setNewOrgLogo("");
                                                    setShowNewOrgInput(true);
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-base-300 rounded-md border border-white/10 animate-fade-in-up">
                                            <div className="flex justify-between items-center mb-2">
                                                <strong className="text-sm">{editingOrgId ? "Edit Company" : "New Company"}</strong>
                                                <button className="btn btn-xs btn-ghost" onClick={() => {
                                                    setShowNewOrgInput(false);
                                                    setEditingOrgId(null);
                                                }}>Cancel</button>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <input
                                                    className="input text-sm"
                                                    placeholder="Company Name"
                                                    aria-label="Company Name"
                                                    value={newOrgName}
                                                    onChange={e => setNewOrgName(e.target.value)}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        className="input text-sm flex-1"
                                                        placeholder="Logo URL or File Path"
                                                        aria-label="Logo URL or File Path"
                                                        value={newOrgLogo}
                                                        onChange={e => setNewOrgLogo(e.target.value)}
                                                    />
                                                    <button className="btn btn-sm" onClick={handleSelectLogo}>
                                                        Select File
                                                    </button>
                                                </div>
                                                {newOrgLogo && (
                                                    <div className="mt-2 p-2 bg-base rounded border border-white/5 flex items-center justify-center">
                                                        <img
                                                            src={renderLogoSrc(newOrgLogo)}
                                                            alt="Preview"
                                                            className="h-10 object-contain"
                                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex justify-between mt-2">
                                                    {editingOrgId ? (
                                                        <button className="btn btn-sm btn-ghost text-error" onClick={handleDeleteOrganization}>
                                                            Delete
                                                        </button>
                                                    ) : <div></div>}
                                                    <button className="btn btn-sm btn-primary" onClick={handleSaveOrganization}>
                                                        {editingOrgId ? "Save Changes" : "Add Company"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <label htmlFor="opp-deal-name" className="flex flex-col gap-1">
                                <span className="text-xs text-muted">Deal Name</span>
                                <input
                                    id="opp-deal-name"
                                    className="input w-full"
                                    value={editingOpp.name}
                                    onChange={e => setEditingOpp({ ...editingOpp, name: e.target.value })}
                                    placeholder="Acme Corp Contract"
                                    autoFocus
                                />
                            </label>
                            <div className="flex gap-4">
                                <label htmlFor="opp-currency" className="flex flex-col gap-1 w-24">
                                    <span className="text-xs text-muted">Currency</span>
                                    <select
                                        id="opp-currency"
                                        className="input w-full"
                                        value={editingOpp.currency || "ZAR"}
                                        onChange={e => setEditingOpp({ ...editingOpp, currency: e.target.value as Currency })}
                                    >
                                        {Currency.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </label>
                                <label htmlFor="opp-value-estimate" className="flex flex-col gap-1 flex-1">
                                    <span className="text-xs text-muted">Value Estimate</span>
                                    <input
                                        id="opp-value-estimate"
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
                                <label htmlFor="opp-probability" className="flex flex-col gap-1 flex-1">
                                    <span className="text-xs text-muted">Probability (%)</span>
                                    <input
                                        id="opp-probability"
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
                            <label htmlFor="opp-stage" className="flex flex-col gap-1">
                                <span className="text-xs text-muted">Stage</span>
                                <select
                                    id="opp-stage"
                                    className="input w-full"
                                    value={editingOpp.stage}
                                    onChange={e => {
                                        const newStage = e.target.value as any;
                                        setEditingOpp(prev => {
                                            if (!prev) return prev;
                                            return {
                                                ...prev,
                                                stage: newStage,
                                                probability: newStage === "ONGOING_PROJECT" ? 100 : prev.probability
                                            };
                                        });
                                    }}
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
                                <label htmlFor="opp-primary-sponsor" className="flex flex-col gap-1 flex-1">
                                    <span className="text-xs text-muted">Primary Buyer / Sponsor</span>
                                    <input
                                        id="opp-primary-sponsor"
                                        className="input w-full"
                                        value={editingOpp.primarySponsor || ""}
                                        onChange={e => setEditingOpp({ ...editingOpp, primarySponsor: e.target.value })}
                                        placeholder="Name of sponsor"
                                    />
                                </label>
                                <label htmlFor="opp-obstacle" className="flex flex-col gap-1 flex-1">
                                    <span className="text-xs text-muted">Obstacle / Risk</span>
                                    <input
                                        id="opp-obstacle"
                                        className="input w-full"
                                        value={editingOpp.obstacle || ""}
                                        onChange={e => setEditingOpp({ ...editingOpp, obstacle: e.target.value })}
                                        placeholder="Biggest risk..."
                                    />
                                </label>
                            </div>

                            <label htmlFor="opp-next-step" className="flex flex-col gap-1">
                                <span className="text-xs text-muted">Next Step</span>
                                <input
                                    id="opp-next-step"
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
                                                        <div className="text-muted">{formatDate(m.startAt!)}</div>
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
