import { useState, useEffect, useMemo } from "react";
import { meetingRepository, contactRepository, protemoiRepository, opportunityRepository } from '../../infrastructure/repositories';
import { Meeting, MeetingAttendee, ThinkingPreference, Contact, Risk, Question, QA, ProtemoiEntry, Opportunity } from '../../domain/entities';
import { groupItemsByWeek, formatDate, formatTime } from "../../utils/dateUtils";
import { Modal } from "../components/Modal";
import { logger } from "../../infrastructure/logger";

type TemplateType = "QUICK" | "DETAILED";

export function MeetingPrep() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [template] = useState<TemplateType>("QUICK");
    const [viewMode, setViewMode] = useState<"UPCOMING" | "HISTORY">("UPCOMING");

    // UI States
    const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
    const [newMeetingTitle, setNewMeetingTitle] = useState("");
    const [newMeetingDate, setNewMeetingDate] = useState("");
    const [newMeetingTime, setNewMeetingTime] = useState("");
    const [newMeetingLocation, setNewMeetingLocation] = useState("");
    const [saveStatus, setSaveStatus] = useState<"IDLE" | "SAVING" | "SAVED" | "ERROR">("IDLE");

    // Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editDate, setEditDate] = useState("");
    const [editTime, setEditTime] = useState("");
    const [editLocation, setEditLocation] = useState("");

    // Complete Modal State
    const [meetingToComplete, setMeetingToComplete] = useState<Meeting | null>(null);
    // const [nextSteps, setNextSteps] = useState(""); // Removed unused

    // Prep Form State
    const [formData, setFormData] = useState({
        // Common / Quick
        goal: "",
        frameGoal: "",
        attendees: [] as MeetingAttendee[], // Changed from text
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

    // Data for linking lookup
    const [allOpps, setAllOpps] = useState<Opportunity[]>([]);
    const [allRels, setAllRels] = useState<ProtemoiEntry[]>([]);
    const [allContacts, setAllContacts] = useState<Contact[]>([]);

    useEffect(() => {
        loadMeetings();
    }, [viewMode]);

    useEffect(() => {
        // Optimization: Bolt ⚡ - Re-applied findAllSummaries since Protemoi summaries now include type & stage
        opportunityRepository.findAllSummaries().then(setAllOpps);
        protemoiRepository.findAllSummaries().then(setAllRels);
        contactRepository.findAllSummaries().then(setAllContacts);
    }, []);

    // Optimization: Memoize grouped history
    const groupedMeetings = useMemo(() => groupItemsByWeek(meetings, 'startAt'), [meetings]);

    // Optimization: Pre-compute lookups
    const oppsMap = useMemo(() => new Map(allOpps.map(o => [o.id, o])), [allOpps]);
    const relsMap = useMemo(() => new Map(allRels.map(r => [r.id, r])), [allRels]);
    const contactsMap = useMemo(() => new Map(allContacts.map(c => [c.id, c])), [allContacts]);

    // Helper to get name
    const getLinkName = (m: Meeting) => {
        if (m.relatedOpportunityId) {
            const op = oppsMap.get(m.relatedOpportunityId);
            return op ? `Op: ${op.name}` : "Unknown Op";
        }
        if (m.relatedProtemoiId) {
            const rel = relsMap.get(m.relatedProtemoiId);
            if (rel) {
                const c = contactsMap.get(rel.contactId);
                return c ? `Rel: ${c.displayName}` : "Unknown Rel";
            }
        }
        return null;
    };

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
                    logger.warn("Could not parse notes as prep data", e);
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
    };

    // Optimization: Bolt ⚡ - Memoize parsed dates for all meetings.
    // This prevents repeated O(N) string-to-Date parsing and garbage collection
    // inside `renderMeetingCard` which is called on every render for every meeting.
    const meetingDates = useMemo(() => {
        const parsed = new Map<string, Date | null>();
        meetings.forEach(m => {
            parsed.set(m.id, m.startAt ? new Date(m.startAt) : null);
        });
        return parsed;
    }, [meetings]);

    const renderMeetingCard = (m: Meeting) => {
        const linkName = getLinkName(m);
        const parsedDate = meetingDates.get(m.id) || null;
        return (
            <button
                type="button"
                key={m.id}
                className={`card text-left w-full focus-visible:ring-2 focus-visible:ring-primary focus:outline-none cursor-pointer hover:border-primary relative group ${m.status === "COMPLETED" ? "bg-base-200" : ""}`}
                onClick={() => setSelectedMeeting(m)}
                aria-label={`Open meeting: ${m.title}`}
            >
                <div className="flex justify-between items-start w-full">
                    <div className="flex items-center gap-2">
                        {m.status === "COMPLETED" && <span className="text-success text-lg font-bold">✓</span>}
                        <h3 className={`font-bold text-lg ${m.status === "COMPLETED" ? "text-muted text-opacity-80" : ""}`}>{m.title}</h3>
                    </div>
                    {m.status !== "COMPLETED" && (
                        <button
                            className="btn btn-sm btn-ghost opacity-40 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-1 transition-opacity text-success"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setMeetingToComplete(m);
                            }}
                            title="Mark as Complete"
                            aria-label={`Mark "${m.title}" as complete`}
                        >
                            ✓
                        </button>
                    )}
                </div>
                <div className="text-muted text-sm mt-1 w-full text-left">
                    {parsedDate ? `${formatDate(parsedDate)} at ${formatTime(parsedDate)}` : "No Date"}
                </div>
                <div className="mt-4 flex justify-between items-center text-xs text-dim w-full">
                    <span>{m.location || "No location"}</span>
                    <div className="flex gap-2">
                        {linkName && <span className="badge badge-outline text-2xs">{linkName}</span>}
                        <span>{m.notesMd ? "📝 Prep Started" : "No Prep"}</span>
                    </div>
                </div>
            </button>
        );
    };

    const loadMeetings = async () => {
        if (viewMode === "UPCOMING") {
            const list = await meetingRepository.findUpcoming(20);
            setMeetings(list);
        } else {
            const list = await meetingRepository.findHistory(20);
            setMeetings(list);
        }
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
                location: newMeetingLocation,
                status: "SCHEDULED",
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
            setNewMeetingLocation("");
        } catch (e) {
            console.error("Failed to create meeting", e);
            alert("Failed to create meeting: " + String(e));
        }
    };

    const openEditModal = () => {
        if (!selectedMeeting) return;
        setEditTitle(selectedMeeting.title);
        if (selectedMeeting.startAt) {
            const date = new Date(selectedMeeting.startAt);
            setEditDate(date.toISOString().split('T')[0]);
            setEditTime(formatTime(date, false));
        }
        setEditLocation(selectedMeeting.location || "");
        setIsEditOpen(true);
    };

    const handleUpdateDetails = async () => {
        if (!selectedMeeting) return;
        try {
            let startAt = selectedMeeting.startAt;
            if (editDate) {
                const timeStr = editTime || "09:00";
                const combined = new Date(`${editDate}T${timeStr}`);
                if (!isNaN(combined.getTime())) startAt = combined.toISOString();
            }

            const updated = {
                ...selectedMeeting,
                title: editTitle,
                startAt,
                location: editLocation,
                updatedAt: new Date().toISOString()
            };

            await meetingRepository.save(updated);
            setSelectedMeeting(updated);
            await loadMeetings();
            setIsEditOpen(false);
        } catch (e) {
            alert("Failed to update: " + String(e));
        }
    };

    const handleCompleteMeeting = async (steps: string, linkType: "NONE" | "OPPORTUNITY" | "RELATIONSHIP", linkId: string) => {
        if (!meetingToComplete) return;

        try {
            const target = meetingToComplete;
            let currentData = { ...formData }; // Fallback to current form state? No, need to parse existing if not selected

            if (target.notesMd) {
                try {
                    currentData = JSON.parse(target.notesMd);
                } catch {
                    // ignore
                }
            }

            // If we are currently editing this meeting, use the latest form data
            if (selectedMeeting && selectedMeeting.id === target.id) {
                currentData = { ...formData };
            }

            const updatedData = { ...currentData, nextStep: steps };

            const updatedMeeting: Meeting = {
                ...target,
                status: "COMPLETED",
                relatedOpportunityId: linkType === "OPPORTUNITY" ? linkId : target.relatedOpportunityId,
                relatedProtemoiId: linkType === "RELATIONSHIP" ? linkId : undefined,
                notesMd: JSON.stringify(updatedData, null, 2),
                updatedAt: new Date().toISOString()
            };

            await meetingRepository.save(updatedMeeting);

            // Sync Next Steps to Linked Entity if provided
            if (steps) {
                // Determine the target entity ID
                const targetOppId = linkType === "OPPORTUNITY" ? linkId : target.relatedOpportunityId;
                const targetRelId = linkType === "RELATIONSHIP" ? linkId : target.relatedProtemoiId;

                if (targetOppId) {
                    try {
                        // Optimization: Bolt ⚡ - O(1) fetch by ID instead of fetching all entities to find one
                        const opp = await opportunityRepository.findById(targetOppId);
                        if (opp) {
                            await opportunityRepository.save({ ...opp, nextStepText: steps, updatedAt: new Date().toISOString() });
                        }
                    } catch (err) {
                        console.error("Failed to sync next step to Opportunity", err);
                    }
                } else if (targetRelId) {
                    try {
                        // Optimization: Bolt ⚡ - O(1) fetch by ID instead of fetching all entities to find one
                        const rel = await protemoiRepository.findById(targetRelId);
                        if (rel) {
                            await protemoiRepository.save({ ...rel, nextStepText: steps, updatedAt: new Date().toISOString() });
                        }
                    } catch (err) {
                        console.error("Failed to sync next step to Relationship", err);
                    }
                }
            }

            // If this was the selected meeting, update UI state
            if (selectedMeeting && selectedMeeting.id === target.id) {
                setSelectedMeeting(updatedMeeting);
                setFormData(updatedData as any);
            }

            await loadMeetings();
            setMeetingToComplete(null);
        } catch (e) {
            alert("Failed to complete meeting: " + String(e));
        }
    };

    const handleUncompleteMeeting = async () => {
        if (!selectedMeeting) return;
        if (selectedMeeting.status !== "COMPLETED") return;

        if (!confirm("Are you sure you want to revert this meeting to SCHEDULED status?")) return;

        try {
            const updated = {
                ...selectedMeeting,
                status: "SCHEDULED" as const,
                updatedAt: new Date().toISOString()
            };

            await meetingRepository.save(updated);
            setSelectedMeeting(updated);
            await loadMeetings();
        } catch (e) {
            console.error("Failed to uncomplete", e);
            alert("Failed to revert status.");
        }
    };

    const handleSave = async () => {
        if (!selectedMeeting) return;

        try {
            setSaveStatus("SAVING");
            const updatedMeeting = {
                ...selectedMeeting,
                notesMd: JSON.stringify(formData, null, 2),
                updatedAt: new Date().toISOString()
            };

            await meetingRepository.save(updatedMeeting);
            setSelectedMeeting(updatedMeeting);
            await loadMeetings();
            setSaveStatus("SAVED");
            setTimeout(() => setSaveStatus("IDLE"), 2000);
        } catch (e) {
            console.error("Save failed:", e);
            setSaveStatus("ERROR");
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
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center h-[70px] px-6 border-b border-white/5 bg-base sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <select
                            aria-label="Toggle view mode"
                            className="input"
                            value={viewMode}
                            onChange={(e) => setViewMode(e.target.value as "UPCOMING" | "HISTORY")}
                            style={{ minWidth: "150px", fontWeight: "bold", cursor: "pointer" }}
                        >
                            <option value="UPCOMING">Upcoming / Active</option>
                            <option value="HISTORY">Meeting History</option>
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={() => setIsNewMeetingOpen(true)}>New Meeting</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar min-h-0">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {viewMode === "HISTORY" ? (
                            Object.keys(groupedMeetings).map(weekLabel => (
                                <div key={weekLabel} className="col-span-full">
                                    <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3 mt-4 border-b border-white/5 pb-1">
                                        {weekLabel}
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {groupedMeetings[weekLabel].map(m => renderMeetingCard(m))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            meetings.map(m => renderMeetingCard(m))
                        )}

                        {meetings.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center text-muted border-2 border-dashed border-base-300 rounded-xl m-4 py-12">
                                <div className="text-6xl mb-6">{viewMode === 'HISTORY' ? '📜' : '📅'}</div>
                                <p className="text-xl font-medium">
                                    {viewMode === "UPCOMING"
                                        ? "No upcoming meetings found."
                                        : "No completed meetings in history."}
                                </p>
                                {viewMode === "UPCOMING" && (
                                    <>
                                        <p className="text-sm mt-2">Create one to get started prepping.</p>
                                        <button className="btn btn-outline mt-6" onClick={() => setIsNewMeetingOpen(true)}>Create Meeting</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {
                        isNewMeetingOpen && (
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
                                    <label htmlFor="new-meeting-name" className="flex flex-col gap-1">
                                        <span className="text-sm font-medium">Meeting Name</span>
                                        <input
                                            id="new-meeting-name"
                                            className="input"
                                            autoFocus
                                            value={newMeetingTitle}
                                            onChange={e => setNewMeetingTitle(e.target.value)}
                                            placeholder="e.g. Q1 Business Review"
                                        />
                                    </label>
                                    <label htmlFor="new-meeting-date" className="flex flex-col gap-1">
                                        <span className="text-sm font-medium">Date</span>
                                        <input
                                            id="new-meeting-date"
                                            type="date"
                                            className="input"
                                            value={newMeetingDate}
                                            onChange={e => setNewMeetingDate(e.target.value)}
                                        />
                                    </label>
                                    <label htmlFor="new-meeting-time" className="flex flex-col gap-1">
                                        <span className="text-sm font-medium">Time</span>
                                        <input
                                            id="new-meeting-time"
                                            type="time"
                                            className="input"
                                            value={newMeetingTime}
                                            onChange={e => setNewMeetingTime(e.target.value)}
                                        />
                                    </label>
                                    <label htmlFor="new-meeting-location" className="flex flex-col gap-1">
                                        <span className="text-sm font-medium">Location</span>
                                        <input
                                            id="new-meeting-location"
                                            className="input"
                                            value={newMeetingLocation}
                                            onChange={e => setNewMeetingLocation(e.target.value)}
                                            placeholder="e.g. Zoom or Office"
                                        />
                                    </label>
                                </div>
                            </Modal>
                        )
                    }

                    {/* Complete Modal - Condition on meetingToComplete */}
                    {
                        !!meetingToComplete && (
                            <Modal isOpen={!!meetingToComplete} onClose={() => setMeetingToComplete(null)} title={`Complete "${meetingToComplete.title}"`}>
                                <CompleteMeetingForm
                                    meeting={meetingToComplete}
                                    onCancel={() => setMeetingToComplete(null)}
                                    onComplete={handleCompleteMeeting}
                                />
                            </Modal>
                        )
                    }
                </div>
            </div >
        );
    }

    // Prep View
    return (
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar" style={{ paddingBottom: "80px" }}>
            <div className="flex flex-col gap-6 relative" style={{ maxWidth: "1000px", margin: "0 auto" }}>
                <div className="flex justify-between items-center sticky top-0 bg-base py-4 z-10 glass px-4 rounded-lg">
                    <div className="flex items-center gap-4">
                        <button className="btn-ghost" onClick={handleBack}>← Back</button>
                        <div className="min-w-0 flex-1">
                            <button
                                type="button"
                                className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded"
                                onClick={openEditModal}
                                aria-label={`Edit meeting details for ${selectedMeeting.title}`}
                            >
                                <h2 className="m-0 text-lg group-hover:underline decoration-dashed truncate">{selectedMeeting.title}</h2>
                                <span className="opacity-40 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-1 text-xs text-muted" aria-hidden="true" title={`Edit ${selectedMeeting.title}`}>✎</span>
                                {selectedMeeting.status === "COMPLETED" && <span className="text-success font-bold text-lg" title="Completed">✓</span>}
                            </button>
                            <div className="text-xs text-muted flex gap-2 mt-1">
                                <span>{selectedMeeting.startAt ? (() => {
                                    // Optimization: Bolt ⚡ - Pre-parse date to avoid repeated string parsing
                                    const parsedDate = new Date(selectedMeeting.startAt);
                                    return `${formatDate(parsedDate)} ${formatTime(parsedDate)}`;
                                })() : ""}</span>
                                {selectedMeeting.location && <span> | 📍 {selectedMeeting.location}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {selectedMeeting.status !== "COMPLETED" && (
                            <button className="btn btn-outline btn-success btn-sm" onClick={() => {
                                setMeetingToComplete(selectedMeeting);
                            }}>✓ Complete</button>
                        )}
                        {selectedMeeting.status === "COMPLETED" && (
                            <button className="btn btn-outline btn-warning btn-sm" onClick={handleUncompleteMeeting}>
                                ↩ Revert to Scheduled
                            </button>
                        )}
                        <button className="btn-ghost text-error" onClick={handleDelete}>Delete</button>
                        <button className="btn" onClick={handleSave} disabled={saveStatus === "SAVING" || selectedMeeting.status === "COMPLETED"}>
                            {saveStatus === "SAVING" ? "Saving..." : saveStatus === "SAVED" ? "Saved!" : "Save Prep"}
                        </button>
                    </div>
                </div>

                {template === "QUICK" ? (
                    <QuickPrepForm data={formData} onChange={handleInputChange} setData={setFormData} />
                ) : (
                    <DetailedPrepForm data={formData} onChange={handleInputChange} setData={setFormData} />
                )}

                {/* Edit Modal */}
                {isEditOpen && (
                    <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Details">
                        <div className="flex flex-col gap-4">
                            <label htmlFor="edit-meeting-title" className="flex flex-col gap-1">
                                <span className="text-xs text-muted">Title</span>
                                <input id="edit-meeting-title" className="input" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                            </label>
                            <div className="flex gap-4">
                                <label htmlFor="edit-meeting-date" className="flex flex-col gap-1 flex-1">
                                    <span className="text-xs text-muted">Date</span>
                                    <input id="edit-meeting-date" type="date" className="input" value={editDate} onChange={e => setEditDate(e.target.value)} />
                                </label>
                                <label htmlFor="edit-meeting-time" className="flex flex-col gap-1 flex-1">
                                    <span className="text-xs text-muted">Time</span>
                                    <input id="edit-meeting-time" type="time" className="input" value={editTime} onChange={e => setEditTime(e.target.value)} />
                                </label>
                            </div>
                            <label htmlFor="edit-meeting-location" className="flex flex-col gap-1">
                                <span className="text-xs text-muted">Location</span>
                                <input id="edit-meeting-location" className="input" value={editLocation} onChange={e => setEditLocation(e.target.value)} />
                            </label>
                            <div className="flex justify-end gap-2 mt-4">
                                <button className="btn-ghost" onClick={() => setIsEditOpen(false)}>Cancel</button>
                                <button className="btn" onClick={handleUpdateDetails}>Update</button>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* Complete Modal - Condition on meetingToComplete */}
                {!!meetingToComplete && (
                    <Modal isOpen={!!meetingToComplete} onClose={() => setMeetingToComplete(null)} title={`Complete "${meetingToComplete.title}"`}>
                        <CompleteMeetingForm
                            meeting={meetingToComplete}
                            onCancel={() => setMeetingToComplete(null)}
                            onComplete={handleCompleteMeeting}
                        />
                    </Modal>
                )}
            </div>
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

// --- Specific Component for Completion ---
function CompleteMeetingForm({ meeting: _meeting, onCancel, onComplete }: { meeting: Meeting, onCancel: () => void, onComplete: (nextSteps: string, linkType: "NONE" | "OPPORTUNITY" | "RELATIONSHIP", linkId: string) => void }) {
    const [nextSteps, setNextSteps] = useState("");
    const [linkType, setLinkType] = useState<"NONE" | "OPPORTUNITY" | "RELATIONSHIP">("NONE");
    const [linkId, setLinkId] = useState("");
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [relationships, setRelationships] = useState<ProtemoiEntry[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);

    useEffect(() => {
        // Load data for linking
        // Optimization: Bolt ⚡ - Re-applied findAllSummaries since Protemoi summaries now include type & stage
        opportunityRepository.findAllSummaries().then(setOpportunities);
        protemoiRepository.findAllSummaries().then(setRelationships);
        contactRepository.findAllSummaries().then(setContacts);
    }, []);

    // Bolt ⚡: O(1) lookup instead of O(N) array find
    const relationshipsMap = useMemo(() => new Map(relationships.map(r => [r.id, r])), [relationships]);
    const contactsMap = useMemo(() => new Map(contacts.map(c => [c.id, c])), [contacts]);

    // Helper to get name for relationship
    const getRelName = (pid: string) => {
        const rel = relationshipsMap.get(pid);
        if (!rel) return "Unknown";
        const c = contactsMap.get(rel.contactId);
        return c ? c.displayName : "Unknown Person";
    };

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">Great job! Capture the next steps and link to a bigger goal.</p>
            <label htmlFor="next-steps-complete" className="flex flex-col gap-1">
                <span className="font-bold text-sm">Next Steps (Required)</span>
                <textarea
                    id="next-steps-complete"
                    className="input w-full"
                    rows={3}
                    placeholder="e.g. Send proposal by Friday..."
                    value={nextSteps}
                    onChange={e => setNextSteps(e.target.value)}
                    autoFocus
                />
            </label>

            <div className="flex flex-col gap-2">
                <span className="font-bold text-sm">Link to Outcome (Optional)</span>
                <div className="tabs tabs-boxed bg-base-200">
                    <button type="button" className={`tab ${linkType === "NONE" ? "tab-active" : ""}`} onClick={() => { setLinkType("NONE"); setLinkId(""); }}>None</button>
                    <button type="button" className={`tab ${linkType === "OPPORTUNITY" ? "tab-active" : ""}`} onClick={() => { setLinkType("OPPORTUNITY"); setLinkId(""); }}>Opportunity</button>
                    <button type="button" className={`tab ${linkType === "RELATIONSHIP" ? "tab-active" : ""}`} onClick={() => { setLinkType("RELATIONSHIP"); setLinkId(""); }}>Relationship</button>
                </div>

                {linkType === "OPPORTUNITY" && (
                    <select aria-label="Select Opportunity" className="input w-full" value={linkId} onChange={e => setLinkId(e.target.value)}>
                        <option value="">Select Opportunity...</option>
                        {opportunities.map(o => (
                            <option key={o.id} value={o.id}>{o.name} ({o.stage})</option>
                        ))}
                    </select>
                )}

                {linkType === "RELATIONSHIP" && (
                    <select aria-label="Select Relationship" className="input w-full" value={linkId} onChange={e => setLinkId(e.target.value)}>
                        <option value="">Select Relationship...</option>
                        {relationships.map(r => (
                            <option key={r.id} value={r.id}>{getRelName(r.id)} ({r.relationshipStage})</option>
                        ))}
                    </select>
                )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <button className="btn-ghost" onClick={onCancel}>Cancel</button>
                <button
                    className="btn btn-success"
                    disabled={!nextSteps}
                    onClick={() => onComplete(nextSteps, linkType, linkId)}
                >
                    Mark Completed
                </button>
            </div>
        </div>
    );
}

// --- Component Implementations ---

function AttendeesManager({ attendees, onChange }: { attendees: MeetingAttendee[], onChange: (a: MeetingAttendee[]) => void }) {
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
            // Optimization: Bolt ⚡ - Re-applied findAllSummaries since Protemoi summaries now include type & stage
            contactRepository.findAllSummaries().then(setContacts);
        }
    }, [isAddOpen, tab]);

    // Optimization: Bolt ⚡ - Memoize contact search and hoist search.toLowerCase() outside the loop
    // Prevents redundant O(N) string conversions during filtering, and avoids unnecessary re-filtering
    // entirely when unrelated state (like newName or tab) changes during renders.
    const filteredContacts = useMemo(() => {
        if (!search) return contacts;
        const lowerSearch = search.toLowerCase();
        return contacts.filter(c => c.displayName.toLowerCase().includes(lowerSearch));
    }, [contacts, search]);

    const handleAddExisting = (contact: Contact) => {
        onChange([...attendees, {
            id: crypto.randomUUID(),
            contactId: contact.id,
            name: contact.displayName,
            thinkingPreference: contact.thinkingPreference || null,
            meetingId: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }]);
        setIsAddOpen(false);
    };

    const handleAddNew = () => {
        if (!newName) return;
        onChange([...attendees, {
            id: crypto.randomUUID(),
            name: newName,
            thinkingPreference: newPref as ThinkingPreference || null,
            meetingId: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
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
                    <div key={a.id} className="badge badge-lg p-3 relative flex items-center gap-2 group border-none" style={{ backgroundColor: getPrefColor(a.thinkingPreference), color: getPrefTextColor(a.thinkingPreference) }}>
                        <span className="font-semibold">{a.name}</span>
                        {a.thinkingPreference && <span className="text-xs opacity-75">({a.thinkingPreference[0]})</span>}
                        <button className="opacity-40 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-1 hover:font-bold ml-1" aria-label={`Remove attendee ${a.name}`} title={`Remove attendee ${a.name}`} onClick={() => removeAttendee(a.id)}>✕</button>
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
                                <input aria-label="Search contacts" className="input" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
                                <div className="flex-1 overflow-y-auto flex flex-col gap-2 max-h-[300px]">
                                    {filteredContacts.map(c => (
                                        <button
                                            type="button"
                                            key={c.id}
                                            className="p-2 hover:bg-white/5 rounded flex justify-between items-center cursor-pointer w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                            onClick={() => handleAddExisting(c)}
                                        >
                                            <span>{c.displayName}</span>
                                            {c.thinkingPreference && <span className="text-xs badge badge-ghost">{c.thinkingPreference}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {tab === "NEW" && (
                            <div className="flex flex-col gap-3 min-h-[200px]">
                                <label htmlFor="new-attendee-name">
                                    <div className="label-text">Name</div>
                                    <input id="new-attendee-name" className="input w-full" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
                                </label>
                                <label htmlFor="new-attendee-pref">
                                    <div className="label-text">Thinking Preference</div>
                                    <select id="new-attendee-pref" className="input w-full" value={newPref} onChange={e => setNewPref(e.target.value as any)}>
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
                        <button className="absolute top-1 right-2 opacity-40 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-1 text-muted hover:text-error" onClick={() => remove(r.id)} aria-label="Remove risk" title="Remove risk">✕</button>
                        <div className="font-bold text-sm text-warning mb-1">⚠️ {r.description}</div>
                        <div className="text-xs text-muted">🛡️ {r.mitigation || "No mitigation planned"}</div>
                    </div>
                ))}
            </div>
            <button className="btn btn-sm btn-outline btn-dashed w-full" onClick={() => setIsOpen(true)}>+ Add Risk</button>

            {isOpen && (
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="What could go wrong?">
                    <div className="flex flex-col gap-4">
                        <label htmlFor="new-risk-desc">
                            <span className="text-sm font-bold block mb-1">Risk / What could wrong?</span>
                            <input id="new-risk-desc" className="input w-full" placeholder="e.g. Key decision maker doesn't show" value={risk} onChange={e => setRisk(e.target.value)} autoFocus />
                        </label>
                        <label htmlFor="new-risk-mitigation">
                            <span className="text-sm font-bold block mb-1">Mitigation</span>
                            <textarea id="new-risk-mitigation" className="input w-full" rows={3} placeholder="e.g. Confirm attendence 2h prior" value={mitigation} onChange={e => setMitigation(e.target.value)} />
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
        <Section title={title} action={<button className="btn btn-xs btn-ghost" onClick={() => setIsOpen(true)} aria-label={`Add ${title}`} title={`Add ${title}`}>+</button>}>
            <ul className="flex flex-col gap-2">
                {questions.map(q => (
                    <li key={q.id} className="p-2 bg-base-200 rounded flex justify-between items-center group">
                        <span>{q.text}</span>
                        <button className="opacity-40 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-1 text-muted hover:text-error px-2" onClick={() => remove(q.id)} aria-label="Remove question" title="Remove question">✕</button>
                    </li>
                ))}
                {questions.length === 0 && <li className="text-muted text-sm italic">No questions added.</li>}
            </ul>

            {isOpen && (
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Add "${title}"`}>
                    <div className="flex flex-col gap-4">
                        <textarea aria-label="New question" className="input w-full" rows={3} placeholder="Type question..." value={txt} onChange={e => setTxt(e.target.value)} autoFocus />
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
        <Section title={title} action={<button className="btn btn-xs btn-ghost" onClick={() => setIsOpen(true)} aria-label={`Add ${title}`} title={`Add ${title}`}>+</button>}>
            <div className="flex flex-col gap-3">
                {qas.map(item => (
                    <div key={item.id} className="p-3 bg-base-200 rounded relative group">
                        <button className="absolute top-2 right-2 opacity-40 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-1 text-muted hover:text-error" onClick={() => remove(item.id)} aria-label="Remove Q&A" title="Remove Q&A">✕</button>
                        <div className="font-bold text-sm mb-1">Q: {item.question}</div>
                        <div className="text-sm text-muted">A: {item.answer}</div>
                    </div>
                ))}
                {qas.length === 0 && <div className="text-muted text-sm italic">No entries.</div>}
            </div>

            {isOpen && (
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Add ${title}`}>
                    <div className="flex flex-col gap-4">
                        <label htmlFor="new-qa-question">
                            <span className="font-bold text-sm block mb-1">Question</span>
                            <input id="new-qa-question" className="input w-full" value={q} onChange={e => setQ(e.target.value)} autoFocus />
                        </label>
                        <label htmlFor="new-qa-answer">
                            <span className="font-bold text-sm block mb-1">Answer / Strategy</span>
                            <textarea id="new-qa-answer" className="input w-full" rows={3} value={a} onChange={e => setA(e.target.value)} />
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
                <textarea aria-label="Goal" className="input w-full" rows={2} value={data.goal} onChange={e => onChange("goal", e.target.value)} />
            </Section>

            <Section title="Frame The Goal For The Buyer" helpText="How would you open the meeting? Do this in a way that is in everyone's best interest.">
                <textarea aria-label="Frame The Goal For The Buyer" className="input w-full" rows={2} value={data.frameGoal} onChange={e => onChange("frameGoal", e.target.value)} />
            </Section>

            <Section title="What could go wrong?" helpText="Plan for potential changes in timing, attendees and anything else.">
                <RiskManager risks={data.risks || []} onChange={val => setData((p: any) => ({ ...p, risks: val }))} />
            </Section>

            <QAManager title="Tough questions they may ask" qas={data.toughQuestions || []} onChange={val => setData((p: any) => ({ ...p, toughQuestions: val }))} />

            <QuestionManager title="My questions" questions={data.myQuestions || []} onChange={val => setData((p: any) => ({ ...p, myQuestions: val }))} />

            <Section title="Asset or experience to bring" helpText="Any specific collateral, demo, or wow factor?">
                <textarea aria-label="Asset or experience to bring" className="input w-full" rows={2} value={data.assets} onChange={e => onChange("assets", e.target.value)} />
            </Section>

            <Section title="Desired next step" helpText="Meeting, intro, data share, decision...">
                <textarea aria-label="Desired next step" className="input w-full" rows={2} value={data.nextStep} onChange={e => onChange("nextStep", e.target.value)} />
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
                    <label htmlFor="detailed-metrics">Metrics <span className="text-muted text-xs block">What financial/numerical info is important?</span>
                        <input id="detailed-metrics" className="input w-full" value={data.background.metrics} onChange={e => onChange("background.metrics", e.target.value)} />
                    </label>
                    <label htmlFor="detailed-goal">Strategic Goal <span className="text-muted text-xs block">What is the client looking to accomplish?</span>
                        <input id="detailed-goal" className="input w-full" value={data.background.goal} onChange={e => onChange("background.goal", e.target.value)} />
                    </label>
                    <label htmlFor="detailed-process">Process <span className="text-muted text-xs block">What procedural elements are most important?</span>
                        <input id="detailed-process" className="input w-full" value={data.background.process} onChange={e => onChange("background.process", e.target.value)} />
                    </label>
                    <label htmlFor="detailed-relationships">Relationships <span className="text-muted text-xs block">What relationship/political issues are important?</span>
                        <input id="detailed-relationships" className="input w-full" value={data.background.relationships} onChange={e => onChange("background.relationships", e.target.value)} />
                    </label>
                </div>
            </Section>

            <Section title="Positioning and key messages">
                <textarea aria-label="Positioning and key messages" className="input w-full" rows={4} placeholder="Positioning Elements | Proof Points" value={data.positioning} onChange={e => onChange("positioning", e.target.value)} />
            </Section>

            <Section title="Goals & Framing">
                <div className="flex flex-col gap-3">
                    <label htmlFor="detailed-goals">Goals <input id="detailed-goals" className="input w-full" value={data.goal} onChange={e => onChange("goal", e.target.value)} /></label>
                    <label htmlFor="detailed-framing">Framing <textarea id="detailed-framing" className="input w-full" rows={2} value={data.frameGoal} onChange={e => onChange("frameGoal", e.target.value)} /></label>
                </div>
            </Section>

            <Section title="Risks (What could go wrong?)">
                <RiskManager risks={data.risks || []} onChange={val => setData((p: any) => ({ ...p, risks: val }))} />
            </Section>

            <Section title="Participant Experience">
                <div className="grid grid-cols-2 gap-4">
                    <label htmlFor="detailed-analytics">Analytics and Pricing <input id="detailed-analytics" className="input w-full" value={data.participantExperience.analytics} onChange={e => onChange("participantExperience.analytics", e.target.value)} /></label>
                    <label htmlFor="detailed-wow">Wow Factor <input id="detailed-wow" className="input w-full" value={data.participantExperience.wow} onChange={e => onChange("participantExperience.wow", e.target.value)} /></label>
                    <label htmlFor="detailed-future-process">Future Process <input id="detailed-future-process" className="input w-full" value={data.participantExperience.process} onChange={e => onChange("participantExperience.process", e.target.value)} /></label>
                    <label htmlFor="detailed-term-relationships">Term Relationships <input id="detailed-term-relationships" className="input w-full" value={data.participantExperience.relationships} onChange={e => onChange("participantExperience.relationships", e.target.value)} /></label>
                </div>
            </Section>

            <Section title="Agenda design">
                <p className="text-muted text-xs mb-2">Topic | Interactive? | Curiosity? | Thinking Styles | Timing | Owner</p>
                <textarea aria-label="Agenda design" className="input w-full" rows={5} placeholder="Use a simple list or markdown table for now..." value={data.agenda} onChange={e => onChange("agenda", e.target.value)} />
            </Section>

            <QAManager title="Tough Questions" qas={data.toughQuestions || []} onChange={val => setData((p: any) => ({ ...p, toughQuestions: val }))} />

            <Section title="Thinking Styles And Advancing Client Relationships">
                <textarea aria-label="Thinking Styles And Advancing Client Relationships" className="input w-full" rows={3} placeholder="Client Name | Role | Path to Raving Fan | Thinking Style..." value={data.thinkingStyles} onChange={e => onChange("thinkingStyles", e.target.value)} />
            </Section>

            <Section title="Next steps Before Final Walk Through">
                <textarea aria-label="Next steps Before Final Walk Through" className="input w-full" rows={2} value={data.nextStep} onChange={e => onChange("nextStep", e.target.value)} placeholder="What | Due Date | Who" />
            </Section>

            <Section title="Other Notes">
                <textarea aria-label="Other Notes" className="input w-full" rows={3} value={data.otherNotes} onChange={e => onChange("otherNotes", e.target.value)} />
            </Section>

            <Section title="Final Walk Through">
                <div className="flex gap-4">
                    <label htmlFor="walkthrough-date" className="flex-1">Date <input id="walkthrough-date" className="input w-full" type="date" value={data.finalWalkthrough.date} onChange={e => onChange("finalWalkthrough.date", e.target.value)} /></label>
                    <label htmlFor="walkthrough-time" className="flex-1">Time <input id="walkthrough-time" className="input w-full" type="time" value={data.finalWalkthrough.time} onChange={e => onChange("finalWalkthrough.time", e.target.value)} /></label>
                    <label htmlFor="walkthrough-location" className="flex-1">Location <input id="walkthrough-location" className="input w-full" value={data.finalWalkthrough.location} onChange={e => onChange("finalWalkthrough.location", e.target.value)} /></label>
                </div>
            </Section>
        </div>
    );
}

