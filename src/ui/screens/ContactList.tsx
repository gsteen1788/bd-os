import { useEffect, useState } from "react";
import { Contact } from "../../domain/entities";
import { contactRepository } from "../../infrastructure/repositories";

export function ContactList() {
    const [contacts, setContacts] = useState<Contact[]>([]);

    useEffect(() => {
        contactRepository.findAll().then(setContacts);
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h2>Relationships</h2>
                <button className="btn">Add New</button>
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead style={{ backgroundColor: "hsl(var(--color-bg-base))" }}>
                        <tr>
                            <th style={{ padding: "12px", borderBottom: "1px solid hsl(var(--color-border))" }}>Name</th>
                            <th style={{ padding: "12px", borderBottom: "1px solid hsl(var(--color-border))" }}>Title</th>
                            <th style={{ padding: "12px", borderBottom: "1px solid hsl(var(--color-border))" }}>Thinking</th>
                            <th style={{ padding: "12px", borderBottom: "1px solid hsl(var(--color-border))" }}>Priority</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map(c => (
                            <tr key={c.id} style={{ borderBottom: "1px solid hsl(var(--color-border))" }}>
                                <td style={{ padding: "12px" }}>
                                    <div style={{ fontWeight: "500" }}>{c.displayName}</div>
                                    <div className="text-muted" style={{ fontSize: "12px" }}>{c.email}</div>
                                </td>
                                <td style={{ padding: "12px" }}>{c.title || "-"}</td>
                                <td style={{ padding: "12px" }}>
                                    {c.thinkingPreference && (
                                        <span style={{
                                            padding: "2px 8px",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            backgroundColor: "rgba(100, 108, 255, 0.2)",
                                            color: "#88aaff"
                                        }}>
                                            {c.thinkingPreference}
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: "12px" }}>{c.primaryBuyInPriority}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
