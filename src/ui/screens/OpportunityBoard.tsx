import { useEffect, useState } from "react";
import { Opportunity } from "../../domain/entities";
import { OpportunityStage } from "../../domain/enums";
import { opportunityRepository } from "../../infrastructure/repositories";

export function OpportunityBoard() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

    useEffect(() => {
        // In a real app we might fetch all and filter in memory or fetch by stage
        // For mock, let's assume we can fetch all or just iterate
        // Since mock repo doesn't have findAll exposed in interface yet, we might need to cast or fix interface.
        // Let's assume we fix the repo to have findAll() or we accept it returns generic arrays.
        // Actually, MockRepository should probably just expose findAll.
        // For now, let's use a workaround if needed, or better: update the Repo.
        opportunityRepository.findAll().then(setOpportunities);
    }, []);

    return (
        <div className="flex flex-col gap-4" style={{ height: "calc(100vh - 100px)" }}>
            <div className="flex justify-between items-center">
                <h2>Pipeline (Opportunities)</h2>
                <button className="btn" onClick={async () => {
                    await opportunityRepository.save({
                        id: crypto.randomUUID(),
                        name: "New Deal " + Math.floor(Math.random() * 100),
                        stage: "CREATE_CURIOSITY",
                        status: "OPEN",
                        probability: 10,
                        valueEstimate: 50000,
                        nextStepText: "Qualify",
                        organizationId: null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                    // Refresh logic would go here, for now just reload or relying on simple state update if we moved state up
                    // But let's just force a reload for this "handover" quick fix or simple mutation
                    // Actually, we can just re-fetch.
                    opportunityRepository.findAll().then(setOpportunities);
                }}>New Opportunity</button>
            </div>

            <div style={{ display: "flex", gap: "16px", overflowX: "auto", height: "100%", paddingBottom: "16px" }}>
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
                                    <div key={opp.id} className="card" style={{ padding: "12px", border: "1px solid hsl(var(--color-border))", backgroundColor: "hsl(var(--color-bg-base))" }}>
                                        <div style={{ fontWeight: "600" }}>{opp.name}</div>
                                        <div className="flex justify-between items-center" style={{ marginTop: "8px", fontSize: "12px" }}>
                                            <span className="text-muted">{opp.valueEstimate ? `$${opp.valueEstimate.toLocaleString()}` : "-"}</span>
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
        </div>
    );
}
