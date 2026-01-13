import { useState, useEffect } from "react";
import { Meeting, Contact, Organization } from "../../domain/entities";
import { meetingRepository, contactRepository, organizationRepository } from "../../infrastructure/repositories";
import { Modal } from "../components/Modal";
import { ThinkingPreference } from "../../domain/enums";

type TemplateType = "QUICK" | "DETAILED";

// --- New Structured Interfaces ---
interface MeetingAttendeeLocal {
    id: string;
    contactId?: string; // If linked to minimal contact
    name: string;
    thinkingPreference?: ThinkingPreference | null;
    role?: string;
}

interface Risk {
    id: string;
    description: string;
    mitigation: string;
}

interface QA {
    id: string;
    question: string;
    answer: string;
}

interface Question {
    id: string;
    text: string;
}

export function MeetingPrep() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [template, setTemplate] = useState<TemplateType>("QUICK");

    // UI States
    const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
    const [newMeetingTitle, setNewMeetingTitle] = useState("");
    const [newMeetingDate, setNewMeetingDate] = useState("");
    const [newMeetingTime, setNewMeetingTime] = useState("");

    // Prep Form State
    const [formData, setFormData] = useState({
        // Common / Quick
        goal: "",
        frameGoal: "",
        attendees: [] as MeetingAttendeeLocal[], // Changed from text
        risks: [] as Risk[], // Changed from object
        toughQuestions: [] as QA[], // Changed from string
        myQuestions: [] as Question[], // Changed from string

        assets: "",
        nextStep: "",

        // Detailed Specifics
        background: { metrics: "", goal: "", process: "", relationships: "" },
        positioning: "",
        participantExperience: { analytics: "", wow: "", process: "", relationships: "" },
        agenda: "",
        unexpected: { timing: "", attendees: "", other: "" }, // Keep legacy for detailed or refactor? Let's keep for now or user might want standardized risks everywhere. User said "What could go wrong... show as small cards". Let's use the new Risks array for both if possible, but Detailed has specific structure. For now, I will unify "What could go wrong" in Quick Prep to use the new Risks card system. Detailed prep's "Unexpected" is minimal text fields, maybe we leave detailed as is or migrate? User instructions were "What could go wrong... show as small cards". This implies the Quick "Risks" section. I will apply new structured fields primarily to where they fit.

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
                    const parsed = JSON.parse(selectedMeeting.notesMd);
                    const { attendees, risks, toughQuestions, myQuestions, ...rest } = parsed;

                    setFormData(() => ({
                        goal: "", frameGoal: "",
                        assets: "", nextStep: "",
                        background: { metrics: "", goal: "", process: "", relationships: "" },
                        positioning: "",
                        participantExperience: { analytics: "", wow: "", process: "", relationships: "" },
                        agenda: "",
                        unexpected: { timing: "", attendees: "", other: "" },
                        finalWalkthrough: { date: "", time: "", location: "" },
                        thinkingStyles: "",
                        otherNotes: "",
                        ...rest,
                        // Ensure arrays
                        attendees: Array.isArray(attendees) ? attendees : [],
                        risks: Array.isArray(risks) ? risks : [],
                        toughQuestions: Array.isArray(toughQuestions) ? toughQuestions : [],
                        myQuestions: Array.isArray(myQuestions) ? myQuestions : [],
                    }));
                } catch (e) {
                    console.log("Could not parse notes as prep data", e);
                    resetForm();
                }
            } else {
                resetForm();
            }
        }
    }, [selectedMeeting]);

    const resetForm = () => {
        setFormData({
            goal: "", frameGoal: "",
            attendees: [],
            risks: [],
            toughQuestions: [],
            myQuestions: [],
            assets: "", nextStep: "",
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

    const loadMeetings = async () => {
        const list = await meetingRepository.findUpcoming(20);
        setMeetings(list);
    };

    const handleCreateNew = async () => {
        if (!newMeetingTitle) return alert("Title required");

        try {
            // Construct start date
            let startAt = new Date().toISOString();
            if (newMeetingDate) {
                const dateStr = newMeetingDate;
                const timeStr = newMeetingTime || "09:00"; // default time
                const combined = new Date(`${dateStr}T${timeStr}`);
                if (!isNaN(combined.getTime())) {
                    startAt = combined.toISOString();
                } else {
                    console.warn("Invalid date constructed, using now");
                }
            }

            const newMeeting: Meeting = {
                id: crypto.randomUUID(),
                title: newMeetingTitle,
                startAt,
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
            setIsNewMeetingOpen(false);
            setNewMeetingTitle("");
            setNewMeetingDate("");
            setNewMeetingTime("");
        } catch (e) {
            console.error("Failed to create meeting", e);
            alert("Failed to create meeting: " + String(e));
        }
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
            setSelectedMeeting(updatedMeeting);
            await loadMeetings();
            // alert("Prep saved successfully!"); // Removed annoying alert
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
                    // console.error(`Invalid form path: ${path} (section missing)`);
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
                    <button className="btn" onClick={() => setIsNewMeetingOpen(true)}>+ New Meeting</button>
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

                {isNewMeetingOpen && (
                    <Modal
                        isOpen={isNewMeetingOpen}
                        onClose={() => setIsNewMeetingOpen(false)}
                        title="New Meeting"
                        footer={
                            <div className="flex justify-end gap-2">
                                <button className="btn-ghost" onClick={() => setIsNewMeetingOpen(false)}>Cancel</button>
                                <button className="btn" onClick={handleCreateNew}>Create</button>
                            </div>
                        }
                    >
                        <div className="flex flex-col gap-4">
                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-medium">Meeting Name</span>
                                <input
                                    className="input"
                                    autoFocus
                                    value={newMeetingTitle}
                                    onChange={e => setNewMeetingTitle(e.target.value)}
                                    placeholder="e.g. Q1 Business Review"
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-medium">Date</span>
                                <input
                                    type="date"
                                    className="input"
                                    value={newMeetingDate}
                                    onChange={e => setNewMeetingDate(e.target.value)}
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-medium">Time</span>
                                <input
                                    type="time"
                                    className="input"
                                    value={newMeetingTime}
                                    onChange={e => setNewMeetingTime(e.target.value)}
                                />
                            </label>
                        </div>
                    </Modal>
                )}
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
                        <div className="text-xs text-muted">{new Date(selectedMeeting.startAt!).toLocaleString()}</div>
                    </div>
                    <select
                        className="input text-sm py-1 px-2 mt-1 ml-4"
                        value={template}
                        onChange={e => setTemplate(e.target.value as TemplateType)}
                    >
                        <option value="QUICK">Quick Prep (W3)</option>
                        <option value="DETAILED">Detailed Prep (W4)</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <button className="btn-ghost text-error" onClick={handleDelete}>Delete</button>
                    <button className="btn" onClick={handleSave}>Save Prep</button>
                </div>
            </div>

            {template === "QUICK" ? (
                <QuickPrepForm data={formData} onChange={handleInputChange} setData={setFormData} />
            ) : (
                <DetailedPrepForm data={formData} onChange={handleInputChange} setData={setFormData} />
            )}
        </div>
    );
}

function Section({ title, children, helpText, action }: { title: string, children: React.ReactNode, helpText?: string, action?: React.ReactNode }) {
    return (
        <div className="card">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="m-0">{title}</h3>
                    {helpText && <p className="text-muted text-sm mt-1">{helpText}</p>}
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

// --- Component Implementations ---

function AttendeesManager({ attendees, onChange }: { attendees: MeetingAttendeeLocal[], onChange: (a: MeetingAttendeeLocal[]) => void }) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [tab, setTab] = useState<"EXISTING" | "NEW">("EXISTING");

    // Existing Search
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [search, setSearch] = useState("");

    // New Contact Form
    const [newName, setNewName] = useState("");
    const [newPref, setNewPref] = useState<ThinkingPreference | "">("");

    useEffect(() => {
        if (isAddOpen && tab === "EXISTING") {
            contactRepository.findAll().then(setContacts);
        }
    }, [isAddOpen, tab]);

    const filteredContacts = contacts.filter(c => c.displayName.toLowerCase().includes(search.toLowerCase()));

    const handleAddExisting = (contact: Contact) => {
        onChange([...attendees, {
            id: crypto.randomUUID(),
            contactId: contact.id,
            name: contact.displayName,
            thinkingPreference: contact.thinkingPreference || null
        }]);
        setIsAddOpen(false);
    };

    const handleAddNew = () => {
        if (!newName) return;
        onChange([...attendees, {
            id: crypto.randomUUID(),
            name: newName,
            thinkingPreference: newPref as ThinkingPreference || null
        }]);
        setIsAddOpen(false);
        setNewName("");
        setNewPref("");
    };

    const removeAttendee = (id: string) => {
        onChange(attendees.filter(a => a.id !== id));
    };

    const getPrefColor = (pref?: ThinkingPreference | null) => {
        switch (pref) {
            case "ANALYTICAL": return "hsl(210, 100%, 93%)";
            case "PRACTICAL": return "hsl(120, 100%, 93%)";
            case "RELATIONAL": return "hsl(0, 100%, 93%)";
            case "EXPERIMENTAL": return "hsl(39, 100%, 93%)";
            default: return "hsla(0, 0%, 100%, 0.1)";
        }
    };
    const getPrefTextColor = (pref?: ThinkingPreference | null) => {
        if (pref) return "hsl(220, 15%, 20%)";
        return "inherit";
    };


    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2">
                {attendees.map(a => (
                    <div key={a.id} className="badge gap-2 py-3 px-3 border-none" style={{ backgroundColor: getPrefColor(a.thinkingPreference), color: getPrefTextColor(a.thinkingPreference) }}>
                        <span className="font-semibold">{a.name}</span>
                        {a.thinkingPreference && <span className="text-xs opacity-75">({a.thinkingPreference[0]})</span>}
                        <button className="hover:font-bold ml-1" onClick={() => removeAttendee(a.id)}>×</button>
                    </div>
                ))}
            </div>
            <button className="btn btn-sm btn-outline btn-dashed w-full" onClick={() => setIsAddOpen(true)}>+ Add Attendee</button>

            {isAddOpen && (
                <Modal
                    isOpen={isAddOpen}
                    onClose={() => setIsAddOpen(false)}
                    title="Add Attendee"
                >
                    <div className="flex flex-col gap-4">
                        <div className="tabs">
                            <button className={`tab tab-bordered ${tab === "EXISTING" ? "tab-active" : ""}`} onClick={() => setTab("EXISTING")}>From Relationships</button>
                            <button className={`tab tab-bordered ${tab === "NEW" ? "tab-active" : ""}`} onClick={() => setTab("NEW")}>New Person</button>
                        </div>

                        {tab === "EXISTING" && (
                            <div className="flex flex-col gap-3 min-h-[300px]">
                                <input className="input" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
                                <div className="flex-1 overflow-y-auto flex flex-col gap-2 max-h-[300px]">
                                    {filteredContacts.map(c => (
                                        <div key={c.id} className="p-2 hover:bg-white/5 rounded flex justify-between items-center cursor-pointer" onClick={() => handleAddExisting(c)}>
                                            <span>{c.displayName}</span>
                                            {c.thinkingPreference && <span className="text-xs badge badge-ghost">{c.thinkingPreference}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {tab === "NEW" && (
                            <div className="flex flex-col gap-3 min-h-[200px]">
                                <label>
                                    <div className="label-text">Name</div>
                                    <input className="input w-full" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
                                </label>
                                <label>
                                    <div className="label-text">Thinking Preference</div>
                                    <select className="input w-full" value={newPref} onChange={e => setNewPref(e.target.value as any)}>
                                        <option value="">Unknown</option>
                                        {ThinkingPreference.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </label>
                                <button className="btn btn-primary mt-4" onClick={handleAddNew}>Add Person</button>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    )
}

function RiskManager({ risks, onChange }: { risks: Risk[], onChange: (r: Risk[]) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [risk, setRisk] = useState("");
    const [mitigation, setMitigation] = useState("");

    const add = () => {
        if (!risk) return;
        onChange([...risks, { id: crypto.randomUUID(), description: risk, mitigation }]);
        setIsOpen(false);
        setRisk("");
        setMitigation("");
    };

    const remove = (id: string) => onChange(risks.filter(r => r.id !== id));

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {risks.map(r => (
                    <div key={r.id} className="p-3 bg-base-200 rounded border border-warning/20 relative group">
                        <button className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 text-muted hover:text-error" onClick={() => remove(r.id)}>✕</button>
                        <div className="font-bold text-sm text-warning mb-1">⚠️ {r.description}</div>
                        <div className="text-xs text-muted">🛡️ {r.mitigation || "No mitigation planned"}</div>
                    </div>
                ))}
            </div>
            <button className="btn btn-sm btn-outline btn-dashed w-full" onClick={() => setIsOpen(true)}>+ Add Risk</button>

            {isOpen && (
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="What could go wrong?">
                    <div className="flex flex-col gap-4">
                        <label>
                            <span className="text-sm font-bold block mb-1">Risk / What could wrong?</span>
                            <input className="input w-full" placeholder="e.g. Key decision maker doesn't show" value={risk} onChange={e => setRisk(e.target.value)} autoFocus />
                        </label>
                        <label>
                            <span className="text-sm font-bold block mb-1">Mitigation</span>
                            <textarea className="input w-full" rows={3} placeholder="e.g. Confirm attendence 2h prior" value={mitigation} onChange={e => setMitigation(e.target.value)} />
                        </label>
                        <button className="btn btn-primary" onClick={add}>Add Risk</button>
                    </div>
                </Modal>
            )}
        </div>
    )
}

function QuestionManager({ title, questions, onChange }: { title: string, questions: Question[], onChange: (q: Question[]) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [txt, setTxt] = useState("");

    const add = () => {
        if (!txt) return;
        onChange([...questions, { id: crypto.randomUUID(), text: txt }]);
        setIsOpen(false);
        setTxt("");
    };

    const remove = (id: string) => onChange(questions.filter(q => q.id !== id));

    return (
        <Section title={title} action={<button className="btn btn-xs btn-ghost" onClick={() => setIsOpen(true)}>+</button>}>
            <ul className="flex flex-col gap-2">
                {questions.map(q => (
                    <li key={q.id} className="p-2 bg-base-200 rounded flex justify-between items-center group">
                        <span>{q.text}</span>
                        <button className="opacity-0 group-hover:opacity-100 text-muted hover:text-error px-2" onClick={() => remove(q.id)}>✕</button>
                    </li>
                ))}
                {questions.length === 0 && <li className="text-muted text-sm italic">No questions added.</li>}
            </ul>

            {isOpen && (
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Add "${title}"`}>
                    <div className="flex flex-col gap-4">
                        <textarea className="input w-full" rows={3} placeholder="Type question..." value={txt} onChange={e => setTxt(e.target.value)} autoFocus />
                        <button className="btn btn-primary" onClick={add}>Add</button>
                    </div>
                </Modal>
            )}
        </Section>
    );
}

function QAManager({ title, qas, onChange }: { title: string, qas: QA[], onChange: (q: QA[]) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [q, setQ] = useState("");
    const [a, setA] = useState("");

    const add = () => {
        if (!q) return;
        onChange([...qas, { id: crypto.randomUUID(), question: q, answer: a }]);
        setIsOpen(false);
        setQ("");
        setA("");
    };

    const remove = (id: string) => onChange(qas.filter(x => x.id !== id));

    return (
        <Section title={title} action={<button className="btn btn-xs btn-ghost" onClick={() => setIsOpen(true)}>+</button>}>
            <div className="flex flex-col gap-3">
                {qas.map(item => (
                    <div key={item.id} className="p-3 bg-base-200 rounded relative group">
                        <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted hover:text-error" onClick={() => remove(item.id)}>✕</button>
                        <div className="font-bold text-sm mb-1">Q: {item.question}</div>
                        <div className="text-sm text-muted">A: {item.answer}</div>
                    </div>
                ))}
                {qas.length === 0 && <div className="text-muted text-sm italic">No entries.</div>}
            </div>

            {isOpen && (
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Add ${title}`}>
                    <div className="flex flex-col gap-4">
                        <label>
                            <span className="font-bold text-sm block mb-1">Question</span>
                            <input className="input w-full" value={q} onChange={e => setQ(e.target.value)} autoFocus />
                        </label>
                        <label>
                            <span className="font-bold text-sm block mb-1">Answer / Strategy</span>
                            <textarea className="input w-full" rows={3} value={a} onChange={e => setA(e.target.value)} />
                        </label>
                        <button className="btn btn-primary" onClick={add}>Add</button>
                    </div>
                </Modal>
            )}
        </Section>
    );
}


function QuickPrepForm({ data, onChange, setData }: { data: any, onChange: (path: string, val: any) => void, setData: any }) {
    return (
        <div className="flex flex-col gap-4">
            <Section title="Attendees & Thinking Preferences" helpText="Who is in the room?">
                <AttendeesManager attendees={data.attendees || []} onChange={val => setData((p: any) => ({ ...p, attendees: val }))} />
            </Section>

            <Section title="Goal" helpText="What do you want to advance? Business development? Relationship? Both?">
                <textarea className="input w-full" rows={2} value={data.goal} onChange={e => onChange("goal", e.target.value)} />
            </Section>

            <Section title="Frame The Goal For The Buyer" helpText="How would you open the meeting? Do this in a way that is in everyone's best interest.">
                <textarea className="input w-full" rows={2} value={data.frameGoal} onChange={e => onChange("frameGoal", e.target.value)} />
            </Section>

            <Section title="What could go wrong?" helpText="Plan for potential changes in timing, attendees and anything else.">
                <RiskManager risks={data.risks || []} onChange={val => setData((p: any) => ({ ...p, risks: val }))} />
            </Section>

            <QAManager title="Tough questions they may ask" qas={data.toughQuestions || []} onChange={val => setData((p: any) => ({ ...p, toughQuestions: val }))} />

            <QuestionManager title="My questions" questions={data.myQuestions || []} onChange={val => setData((p: any) => ({ ...p, myQuestions: val }))} />

            <Section title="Asset or experience to bring" helpText="Any specific collateral, demo, or wow factor?">
                <textarea className="input w-full" rows={2} value={data.assets} onChange={e => onChange("assets", e.target.value)} />
            </Section>

            <Section title="Desired next step" helpText="Meeting, intro, data share, decision...">
                <textarea className="input w-full" rows={2} value={data.nextStep} onChange={e => onChange("nextStep", e.target.value)} />
            </Section>
        </div>
    );
}

function DetailedPrepForm({ data, onChange, setData }: { data: any, onChange: (path: string, val: any) => void, setData: any }) {
    return (
        <div className="flex flex-col gap-4">
            <Section title="Attendees">
                <AttendeesManager attendees={data.attendees || []} onChange={val => setData((p: any) => ({ ...p, attendees: val }))} />
            </Section>

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

            <Section title="Risks (What could go wrong?)">
                <RiskManager risks={data.risks || []} onChange={val => setData((p: any) => ({ ...p, risks: val }))} />
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

            <QAManager title="Tough Questions" qas={data.toughQuestions || []} onChange={val => setData((p: any) => ({ ...p, toughQuestions: val }))} />

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

