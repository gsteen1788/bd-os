import { useEffect, useState } from "react";
import { ProtemoiEntry, Contact } from "../../domain/entities";
import { RelationshipStage } from "../../domain/enums";
import { protemoiRepository, contactRepository } from "../../infrastructure/repositories";

type ProtemoiWithContact = ProtemoiEntry & { contact?: Contact };

export function ProtemoiBoard() {
    const [entries, setEntries] = useState<ProtemoiWithContact[]>([]);

    const load = async () => {
        const protemoi = await protemoiRepository.findAll();
        const contacts = await contactRepository.findAll();

        const combined = protemoi.map(p => ({
            ...p,
            contact: contacts.find(c => c.id === p.contactId)
        }));
        setEntries(combined);
    };

    useEffect(() => {
        load();
    }, []);

    const handleAdd = async () => {
        // Create a dummy contact and protemoi entry for now
        const contactId = crypto.randomUUID();
        await contactRepository.save({
            id: contactId,
            displayName: "New Contact " + Math.floor(Math.random() * 1000),
            email: "test@example.com",
            phone: "",
            organizationId: null,
            title: "Prospect",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        await protemoiRepository.save({
            id: crypto.randomUUID(),
            contactId: contactId,
            relationshipStage: "TARGET",
            protemoiType: "CLIENT_OR_PROSPECT",
            nextStepText: "Initial outreach",
            nextStepDueDate: new Date().toISOString(),
            lastTouchDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        load();
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h2>Relationship Board (Protemoi)</h2>
                <button className="btn" onClick={handleAdd}>+ Add Test Entry</button>
            </div>
            <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "16px" }}>
                {RelationshipStage.map(stage => {
                    const stageEntries = entries.filter(e => e.relationshipStage === stage);
                    if (stageEntries.length === 0) return null; // Or show empty column

                    return (
                        <div key={stage} style={{ minWidth: "300px", backgroundColor: "hsl(var(--color-bg-surface))", borderRadius: "8px", padding: "12px" }}>
                            <h4 style={{ margin: "0 0 12px 0", color: "hsl(var(--color-text-muted))", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>
                                {stage.replace(/_/g, " ")} ({stageEntries.length})
                            </h4>

                            <div className="flex flex-col gap-2">
                                {stageEntries.map(entry => (
                                    <div key={entry.id} className="card" style={{ padding: "12px", border: "1px solid hsl(var(--color-border))" }}>
                                        <div style={{ fontWeight: "600", color: "white" }}>{entry.contact?.displayName || "Unknown Contact"}</div>
                                        <div className="text-muted" style={{ fontSize: "12px" }}>{entry.protemoiType}</div>

                                        {entry.nextStepText && (
                                            <div style={{ marginTop: "8px", fontSize: "13px", padding: "4px 8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }}>
                                                Next: {entry.nextStepText}
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
