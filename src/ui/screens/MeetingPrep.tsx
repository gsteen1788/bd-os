import { useState, useEffect } from "react";
import { Meeting } from "../../domain/entities";
import { meetingRepository } from "../../infrastructure/repositories";

type TemplateType = "QUICK" | "DETAILED";

export function MeetingPrep() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [template, setTemplate] = useState<TemplateType>("QUICK");

    // Prep Form State
    const [formData, setFormData] = useState({
        // Common / Quick
        goal: "",
        frameGoal: "",
        attendees_text: "",
        risks: { timing: "", attendees: "", other: "" },
        toughQuestions: "",
        myQuestions: "",
        assets: "",
        nextStep: "",

        // Detailed Specifics
        background: { metrics: "", goal: "", process: "", relationships: "" },
        positioning: "",
        participantExperience: { analytics: "", wow: "", process: "", relationships: "" },
        agenda: "",
        unexpected: { timing: "", attendees: "", other: "" },
        finalWalkthrough: { date: "", time: "", location: "" },

        // Added missing fields
        thinkingStyles: "",
        otherNotes: ""
    });

    // Load meetings list on mount
    useEffect(() => {
        loadMeetings();
    }, []);

    // When a meeting is selected, load its prep data
    useEffect(() => {
        if (selectedMeeting) {
            if (selectedMeeting.notesMd) {
                try {
                    // Try to parse existing notes as JSON
                    const parsed = JSON.parse(selectedMeeting.notesMd);
                    // If it looks like our data structure, load it
                    // Check for a known field to validate
                    if (parsed.goal || parsed.background || parsed.attendees_text) {
                        setFormData(() => ({
                            // Reset to defaults first to clear old data, then merge parsed
                            goal: "", frameGoal: "", attendees_text: "",
                            risks: { timing: "", attendees: "", other: "" },
                            toughQuestions: "", myQuestions: "", assets: "", nextStep: "",
                            background: { metrics: "", goal: "", process: "", relationships: "" },
                            positioning: "",
                            participantExperience: { analytics: "", wow: "", process: "", relationships: "" },
                            agenda: "",
                            unexpected: { timing: "", attendees: "", other: "" },
                            finalWalkthrough: { date: "", time: "", location: "" },
                            thinkingStyles: "",
                            otherNotes: "",
                            ...parsed
                        }));
                        return;
                    }
                } catch (e) {
                    console.log("Could not parse notes as prep data", e);
                }
            }

            // Fallback: Reset to empty if no notes or parsing failed
            setFormData({
                goal: "", frameGoal: "", attendees_text: "",
                risks: { timing: "", attendees: "", other: "" },
                toughQuestions: "", myQuestions: "", assets: "", nextStep: "",
                background: { metrics: "", goal: "", process: "", relationships: "" },
                positioning: "",
                participantExperience: { analytics: "", wow: "", process: "", relationships: "" },
                agenda: "",
                unexpected: { timing: "", attendees: "", other: "" },
                finalWalkthrough: { date: "", time: "", location: "" },
                thinkingStyles: "",
                otherNotes: ""
            });
        }
    }, [selectedMeeting]);

    const loadMeetings = async () => {
        const list = await meetingRepository.findUpcoming(20);
        setMeetings(list);
    };

    const handleCreateNew = async () => {
        const title = prompt("Meeting Title:");
        if (!title) return;

        const newMeeting: Meeting = {
            id: crypto.randomUUID(),
            title,
            startAt: new Date().toISOString(), // Default to now
            endAt: null,
            location: "",
            organizationId: null,
            notesMd: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await meetingRepository.save(newMeeting);
        await loadMeetings();
        setSelectedMeeting(newMeeting);
    };

    const handleSave = async () => {
        if (!selectedMeeting) return;

        try {
            console.log("Saving meeting prep:", formData);
            const updatedMeeting = {
                ...selectedMeeting,
                notesMd: JSON.stringify(formData, null, 2),
                updatedAt: new Date().toISOString()
            };

            await meetingRepository.save(updatedMeeting);
            // Update local state completely to ensure consistency
            setSelectedMeeting(updatedMeeting);
            // Refresh list to show 'Prep Started' indicator if it changed
            await loadMeetings();
            alert("Prep saved successfully!");
        } catch (e) {
            console.error("Save failed:", e);
            alert("Error saving: " + String(e));
        }
    };

    const handleDelete = async () => {
        if (!selectedMeeting) return;
        if (!confirm(`Are you sure you want to delete "${selectedMeeting.title}"?`)) return;

        try {
            await meetingRepository.delete(selectedMeeting.id);
            setSelectedMeeting(null);
            await loadMeetings();
        } catch (e) {
            console.error("Delete failed:", e);
            alert("Failed to delete meeting: " + String(e));
        }
    };

    const handleBack = () => {
        setSelectedMeeting(null);
    };

    const handleInputChange = (path: string, value: any) => {
        setFormData(prev => {
            const parts = path.split('.');
            if (parts.length === 1) {
                return { ...prev, [path]: value };
            } else if (parts.length === 2) {
                const section = parts[0] as keyof typeof prev;
                // Safety check for section existence
                if (!prev[section]) {
                    console.error(`Invalid form path: ${path} (section missing)`);
                    return prev;
                }
                return {
                    ...prev,
                    [section]: { ...prev[section] as any, [parts[1]]: value }
                };
            }
            return prev;
        });
    };

    // If no meeting selected, show list
    if (!selectedMeeting) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h2>Meeting Prep</h2>
                    <button className="btn" onClick={handleCreateNew}>+ New Meeting</button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {meetings.map(m => (
                        <div key={m.id} className="card cursor-pointer hover:border-primary" onClick={() => setSelectedMeeting(m)}>
                            <h3 className="font-bold text-lg">{m.title}</h3>
                            <div className="text-muted text-sm mt-1">
                                {new Date(m.startAt!).toLocaleDateString()} at {new Date(m.startAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="mt-4 flex justify-between items-center text-xs text-dim">
                                <span>{m.location || "No location"}</span>
                                <span>{m.notesMd ? "📝 Prep Started" : "No Prep"}</span>
                            </div>
                        </div>
                    ))}
                    {meetings.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted">
                            No upcoming meetings found. Create one to get started.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Prep View
    return (
        <div className="flex flex-col gap-6" style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "80px" }}>
            <div className="flex justify-between items-center sticky top-0 bg-base py-4 z-10 glass px-4 rounded-lg">
                <div className="flex items-center gap-4">
                    <button className="btn-ghost" onClick={handleBack}>← Back</button>
                    <div>
                        <h2 className="m-0 text-lg">{selectedMeeting.title}</h2>
                        <select
                            className="input text-sm py-1 px-2 mt-1"
                            value={template}
                            onChange={e => setTemplate(e.target.value as TemplateType)}
                        >
                            <option value="QUICK">Quick Prep (W3)</option>
                            <option value="DETAILED">Detailed Prep (W4)</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="btn-ghost text-error" onClick={handleDelete}>Delete</button>
                    <button className="btn" onClick={handleSave}>Save Prep</button>
                </div>
            </div>

            {template === "QUICK" ? (
                <QuickPrepForm data={formData} onChange={handleInputChange} />
            ) : (
                <DetailedPrepForm data={formData} onChange={handleInputChange} />
            )}
        </div>
    );
}

function Section({ title, children, helpText }: { title: string, children: React.ReactNode, helpText?: string }) {
    return (
        <div className="card">
            <h3 style={{ marginBottom: helpText ? "4px" : "16px" }}>{title}</h3>
            {helpText && <p className="text-muted" style={{ marginBottom: "16px", fontSize: "14px" }}>{helpText}</p>}
            {children}
        </div>
    );
}

function QuickPrepForm({ data, onChange }: { data: any, onChange: (path: string, val: any) => void }) {
    return (
        <div className="flex flex-col gap-4">
            <Section title="Attendees & Thinking Preferences" helpText="Names and thinking styles and buy in priority">
                {/* Simplified Table for Quick Prep */}
                <textarea
                    className="input w-full"
                    rows={4}
                    placeholder="List attendees here (Name - Preference - Priority)..."
                    value={data.attendees_text || ""}
                    onChange={e => onChange("attendees_text", e.target.value)}
                />
            </Section>

            <Section title="Goal" helpText="What do you want to advance? Business development? Relationship? Both?">
                <textarea className="input w-full" rows={2} value={data.goal} onChange={e => onChange("goal", e.target.value)} />
            </Section>

            <Section title="Frame The Goal For The Buyer" helpText="How would you open the meeting? Do this in a way that is in everyone's best interest.">
                <textarea className="input w-full" rows={2} value={data.frameGoal} onChange={e => onChange("frameGoal", e.target.value)} />
            </Section>

            <Section title="What could go wrong?" helpText="Plan for potential changes in timing, attendees and anything else.">
                <div className="flex flex-col gap-2">
                    <label>Timing <input className="input w-full" value={data.risks.timing} onChange={e => onChange("risks.timing", e.target.value)} /></label>
                    <label>Attendees <input className="input w-full" value={data.risks.attendees} onChange={e => onChange("risks.attendees", e.target.value)} /></label>
                    <label>Other <input className="input w-full" value={data.risks.other} onChange={e => onChange("risks.other", e.target.value)} /></label>
                </div>
            </Section>

            <Section title="Tough questions they may ask">
                <textarea className="input w-full" rows={3} value={data.toughQuestions} onChange={e => onChange("toughQuestions", e.target.value)} />
            </Section>

            <Section title="My questions" helpText="Reveal priorities, surface tension, create insight">
                <textarea className="input w-full" rows={3} value={data.myQuestions} onChange={e => onChange("myQuestions", e.target.value)} />
            </Section>

            <Section title="Asset or experience to bring" helpText="Timing, missing stakeholders, defensiveness, scope creep">
                <textarea className="input w-full" rows={2} value={data.assets} onChange={e => onChange("assets", e.target.value)} />
            </Section>

            <Section title="Desired next step" helpText="Meeting, intro, data share, decision...">
                <textarea className="input w-full" rows={2} value={data.nextStep} onChange={e => onChange("nextStep", e.target.value)} />
            </Section>
        </div>
    );
}

function DetailedPrepForm({ data, onChange }: { data: any, onChange: (path: string, val: any) => void }) {
    return (
        <div className="flex flex-col gap-4">
            <Section title="Background Information">
                <div className="flex flex-col gap-3">
                    <label>Metrics <span className="text-muted text-xs block">What financial/numerical info is important?</span>
                        <input className="input w-full" value={data.background.metrics} onChange={e => onChange("background.metrics", e.target.value)} />
                    </label>
                    <label>Strategic Goal <span className="text-muted text-xs block">What is the client looking to accomplish?</span>
                        <input className="input w-full" value={data.background.goal} onChange={e => onChange("background.goal", e.target.value)} />
                    </label>
                    <label>Process <span className="text-muted text-xs block">What procedural elements are most important?</span>
                        <input className="input w-full" value={data.background.process} onChange={e => onChange("background.process", e.target.value)} />
                    </label>
                    <label>Relationships <span className="text-muted text-xs block">What relationship/political issues are important?</span>
                        <input className="input w-full" value={data.background.relationships} onChange={e => onChange("background.relationships", e.target.value)} />
                    </label>
                </div>
            </Section>

            <Section title="Positioning and key messages">
                <textarea className="input w-full" rows={4} placeholder="Positioning Elements | Proof Points" value={data.positioning} onChange={e => onChange("positioning", e.target.value)} />
            </Section>

            <Section title="Goals & Framing">
                <div className="flex flex-col gap-3">
                    <label>Goals <input className="input w-full" value={data.goal} onChange={e => onChange("goal", e.target.value)} /></label>
                    <label>Framing <textarea className="input w-full" rows={2} value={data.frameGoal} onChange={e => onChange("frameGoal", e.target.value)} /></label>
                </div>
            </Section>

            <Section title="Participant Experience">
                <div className="grid grid-cols-2 gap-4">
                    <label>Analytics and Pricing <input className="input w-full" value={data.participantExperience.analytics} onChange={e => onChange("participantExperience.analytics", e.target.value)} /></label>
                    <label>Wow Factor <input className="input w-full" value={data.participantExperience.wow} onChange={e => onChange("participantExperience.wow", e.target.value)} /></label>
                    <label>Future Process <input className="input w-full" value={data.participantExperience.process} onChange={e => onChange("participantExperience.process", e.target.value)} /></label>
                    <label>Term Relationships <input className="input w-full" value={data.participantExperience.relationships} onChange={e => onChange("participantExperience.relationships", e.target.value)} /></label>
                </div>
            </Section>

            <Section title="Agenda design">
                <p className="text-muted text-xs mb-2">Topic | Interactive? | Curiosity? | Thinking Styles | Timing | Owner</p>
                <textarea className="input w-full" rows={5} placeholder="Use a simple list or markdown table for now..." value={data.agenda} onChange={e => onChange("agenda", e.target.value)} />
            </Section>

            <Section title="Planning for the unexpected">
                <div className="flex flex-col gap-2">
                    <label>Changes in Timing <input className="input w-full" value={data.unexpected.timing} onChange={e => onChange("unexpected.timing", e.target.value)} /></label>
                    <label>Changes in Attendees <input className="input w-full" value={data.unexpected.attendees} onChange={e => onChange("unexpected.attendees", e.target.value)} /></label>
                    <label>Other Changes <input className="input w-full" value={data.unexpected.other} onChange={e => onChange("unexpected.other", e.target.value)} /></label>
                </div>
            </Section>

            <Section title="Tough questions">
                <textarea className="input w-full" rows={3} placeholder="Questions they might ask..." value={data.toughQuestions} onChange={e => onChange("toughQuestions", e.target.value)} />
            </Section>

            <Section title="Thinking Styles And Advancing Client Relationships">
                <textarea className="input w-full" rows={3} placeholder="Client Name | Role | Path to Raving Fan | Thinking Style..." value={data.thinkingStyles} onChange={e => onChange("thinkingStyles", e.target.value)} />
            </Section>

            <Section title="Next steps Before Final Walk Through">
                <textarea className="input w-full" rows={2} value={data.nextStep} onChange={e => onChange("nextStep", e.target.value)} placeholder="What | Due Date | Who" />
            </Section>

            <Section title="Other Notes">
                <textarea className="input w-full" rows={3} value={data.otherNotes} onChange={e => onChange("otherNotes", e.target.value)} />
            </Section>

            <Section title="Final Walk Through">
                <div className="flex gap-4">
                    <label className="flex-1">Date <input className="input w-full" type="date" value={data.finalWalkthrough.date} onChange={e => onChange("finalWalkthrough.date", e.target.value)} /></label>
                    <label className="flex-1">Time <input className="input w-full" type="time" value={data.finalWalkthrough.time} onChange={e => onChange("finalWalkthrough.time", e.target.value)} /></label>
                    <label className="flex-1">Location <input className="input w-full" value={data.finalWalkthrough.location} onChange={e => onChange("finalWalkthrough.location", e.target.value)} /></label>
                </div>
            </Section>
        </div>
    );
}
