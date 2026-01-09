import { useState } from "react";
import { ThinkingPreference, BuyInPriority } from "../../domain/enums";

export function MeetingPrep() {
    const [formData, setFormData] = useState({
        goal: "",
        frameGoalForBuyer: "",
        assetToBring: "",
        attendees: [] as any[] // Simplified for mock
    });

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="flex flex-col gap-4" style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>
            <div className="flex justify-between items-center">
                <h2>Meeting Prep (Standard)</h2>
                <div className="flex gap-2">
                    <button className="btn" style={{ backgroundColor: "transparent", border: "1px solid hsl(var(--color-border))" }}>Cancel</button>
                    <button className="btn">Save Prep</button>
                </div>
            </div>

            <div className="card">
                <h3>1. Clear Goal</h3>
                <p className="text-muted" style={{ marginBottom: "16px" }}>What do you want to advance? Business development, relationship, or both.</p>
                <textarea
                    className="input"
                    rows={3}
                    style={{ width: "100%" }}
                    placeholder="e.g. Move to the next stage by agreeing on a pilot scope..."
                    value={formData.goal}
                    onChange={e => handleInputChange("goal", e.target.value)}
                />
            </div>

            <div className="card">
                <h3>2. Frame Goal for Buyer</h3>
                <p className="text-muted" style={{ marginBottom: "16px" }}>How you will open the meeting in a way that is in everyone's best interest.</p>
                <textarea
                    className="input"
                    rows={3}
                    style={{ width: "100%" }}
                    placeholder="e.g. To see if there is a fit between our capabilities and your Q3 goals..."
                    value={formData.frameGoalForBuyer}
                    onChange={e => handleInputChange("frameGoalForBuyer", e.target.value)}
                />
            </div>

            <div className="card">
                <h3>3. Attendees & Thinking Preferences</h3>
                <p className="text-muted" style={{ marginBottom: "16px" }}>Map out who is in the room and how they think.</p>

                <div style={{ padding: "12px", border: "1px dashed hsl(var(--color-border))", borderRadius: "8px", textAlign: "center", cursor: "pointer" }}>
                    + Add Attendee
                </div>

                <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div style={{ padding: "12px", backgroundColor: "hsl(var(--color-bg-base))", borderRadius: "8px" }}>
                        <div style={{ fontWeight: "600" }}>Alice Smith (Example)</div>
                        <div style={{ marginTop: "8px" }}>
                            <label style={{ display: "block", fontSize: "12px", color: "hsl(var(--color-text-muted))" }}>Thinking Preference</label>
                            <select className="input" style={{ width: "100%" }}>
                                {ThinkingPreference.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div style={{ marginTop: "8px" }}>
                            <label style={{ display: "block", fontSize: "12px", color: "hsl(var(--color-text-muted))" }}>Buy-In Priority</label>
                            <select className="input" style={{ width: "100%" }}>
                                {BuyInPriority.map(p => <option key={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>4. Flexibility Plan</h3>
                <div className="flex flex-col gap-4">
                    <div>
                        <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Timing Risks</label>
                        <input className="input" style={{ width: "100%" }} placeholder="What if they cut the meeting short?" />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Attendee Risks</label>
                        <input className="input" style={{ width: "100%" }} placeholder="What if the decision maker doesn't show?" />
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>5. Assets</h3>
                <div>
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Asset to Bring/Show</label>
                    <input
                        className="input"
                        style={{ width: "100%" }}
                        placeholder="e.g. Case study PDF, Physical sample..."
                        value={formData.assetToBring}
                        onChange={e => handleInputChange("assetToBring", e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}
