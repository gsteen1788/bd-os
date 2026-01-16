import { useEffect, useState } from "react";
import { Modal } from "../components/Modal";
import { open } from "@tauri-apps/api/dialog";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { ThinkingPreference } from "../../domain/enums";
import { ProtemoiEntry, Contact, Organization, Meeting } from "../../domain/entities";
import { protemoiRepository, contactRepository, organizationRepository, meetingRepository } from "../../infrastructure/repositories";


type ProtemoiWithDetails = ProtemoiEntry & {
    contact?: Contact;
    organization?: Organization;
};

const EXTERNAL_STAGES = [
    "TARGET", "ACQUAINTANCE", "CURIOUS_SKEPTIC", "NEW_CLIENT",
    "SOLID_WORKING_RELATIONSHIP", "TRUSTED_ADVISEE", "RAVING_FAN"
] as const;

const INTERNAL_STAGES = [
    "TARGET", "ACQUAINTANCE", "CURIOUS_SKEPTIC", "NEW_COLLABORATOR",
    "SOLID_WORKING_RELATIONSHIP", "TRUSTED_ADVISEE", "RAVING_FAN"
] as const;

const EXTERNAL_TYPES = [
    "CLIENT_OR_PROSPECT", "STRONG_INFLUENCER", "STRATEGIC_PARTNER", "INTERESTING_PERSON"
] as const;

const INTERNAL_TYPES = [
    "SPONSOR_ADVOCATE", "CO_SELL_ACCOUNT_ACCESS", "PRACTICE_TOPIC_LEADER", "CONNECTOR", "MENTOR_COACH"
] as const;

import { MITModal } from "../components/MITModal";
import { LinkedInIcon } from "../icons/Icons";

function getPreferenceColor(preference?: ThinkingPreference | null): string {
    switch (preference) {
        case "ANALYTICAL": return "hsl(210, 100%, 93%)"; // Light Blue
        case "PRACTICAL": return "hsl(120, 100%, 93%)"; // Light Green
        case "RELATIONAL": return "hsl(0, 100%, 93%)";   // Light Red
        case "EXPERIMENTAL": return "hsl(39, 100%, 93%)"; // Light Orange
        default: return "hsla(0, 0%, 100%, 0.03)"; // Default dark glass
    }
}

function getPreferenceTextColor(preference?: ThinkingPreference | null): string {
    if (preference) return "hsl(220, 15%, 20%)";
    return "inherit";
}

export function ProtemoiBoard() {
    const [entries, setEntries] = useState<ProtemoiWithDetails[]>([]);
    const [editingEntry, setEditingEntry] = useState<ProtemoiWithDetails | null>(null);
    const [viewMode, setViewMode] = useState<"EXTERNAL" | "INTERNAL">("EXTERNAL");

    // Organization Management
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [showNewOrgInput, setShowNewOrgInput] = useState(false); // Controls the Org Form visibility
    const [editingOrgId, setEditingOrgId] = useState<string | null>(null); // If set, we are editing this org
    const [newOrgName, setNewOrgName] = useState("");
    const [newOrgLogo, setNewOrgLogo] = useState("");
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
        if (editingEntry?.id) {
            meetingRepository.findByProtemoiId(editingEntry.id)
                .then(setLinkedMeetings)
                .catch(err => console.error("Failed to load linked meetings", err));
        } else {
            setLinkedMeetings([]);
        }
    }, [editingEntry?.id]);

    // Dynamic definitions
    const activeStages = viewMode === "INTERNAL" ? INTERNAL_STAGES : EXTERNAL_STAGES;

    // Helper to get available types for editing based on the entry's state
    const getTypesForEntry = (isInternal: boolean | undefined) => isInternal ? INTERNAL_TYPES : EXTERNAL_TYPES;
    const getStagesForEntry = (isInternal: boolean | undefined) => isInternal ? INTERNAL_STAGES : EXTERNAL_STAGES;

    const load = async () => {
        try {
            const protemoi = await protemoiRepository.findAll();
            const contacts = await contactRepository.findAll();
            const orgs = await organizationRepository.findAll();
            setOrganizations(orgs);

            const combined = protemoi.map(p => {
                const contact = contacts.find(c => c.id === p.contactId);
                const orgId = p.organizationId || contact?.organizationId;
                const organization = orgs.find(o => o.id === orgId);

                return {
                    ...p,
                    contact,
                    organization
                };
            });
            setEntries(combined);
        } catch (e) {
            console.error("Load failed:", e);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const filteredEntries = entries.filter(e => {
        const isInternal = e.isInternal;
        return viewMode === "INTERNAL" ? isInternal : !isInternal;
    });

    const handleSave = async () => {
        if (!editingEntry) return;

        try {
            // Save contact first
            if (editingEntry.contact) {
                await contactRepository.save({
                    ...editingEntry.contact,
                    // Ensure organizationId is synced to contact as well (optional but good for consistency)
                    organizationId: editingEntry.organizationId,
                    displayName: editingEntry.contact.displayName || "Unknown",
                    updatedAt: new Date().toISOString(),
                    createdAt: editingEntry.contact.createdAt || new Date().toISOString(),
                });
            }

            // Save relationship
            await protemoiRepository.save({
                id: editingEntry.id,
                contactId: editingEntry.contactId,
                organizationId: editingEntry.organizationId,

                protemoiType: editingEntry.protemoiType,
                relationshipStage: editingEntry.relationshipStage,
                nextStepText: editingEntry.nextStepText,
                nextStepDueDate: editingEntry.nextStepDueDate,
                lastTouchDate: editingEntry.lastTouchDate,
                nextTouchDate: editingEntry.nextTouchDate,
                importanceScore: editingEntry.importanceScore,
                isInternal: editingEntry.isInternal,

                createdAt: editingEntry.createdAt,
                updatedAt: new Date().toISOString()
            } as ProtemoiEntry);

            setEditingEntry(null);
            // Ensure any temp UI parsing is reset
            setShowNewOrgInput(false);
            load();
        } catch (e) {
            console.error(e);
            alert("Failed to save: " + e);
        }
    };

    const handleDelete = async () => {
        if (!editingEntry) return;
        if (!confirm("Delete this relationship?")) return;

        try {
            await protemoiRepository.delete(editingEntry.id);
            setEditingEntry(null);
            load();
        } catch (e) {
            alert("Error deleting: " + e);
        }
    }

    const handleSaveOrganization = async () => {
        if (!newOrgName.trim()) {
            alert("Please enter a company name");
            return;
        }

        try {
            if (editingOrgId) {
                // UPDATE existing
                const existing = organizations.find(o => o.id === editingOrgId);
                if (!existing) return;

                const updatedOrg: Organization = {
                    ...existing,
                    name: newOrgName,
                    logoUrl: newOrgLogo || null,
                    updatedAt: new Date().toISOString()
                };

                await organizationRepository.save(updatedOrg);
                setOrganizations(prev => prev.map(o => o.id === editingOrgId ? updatedOrg : o));
            } else {
                // CREATE new
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

                // Select only if we were creating for a specific entry
                setEditingEntry(prev => prev ? { ...prev, organizationId: newOrgId } : null);
            }

            // Reset
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

            // Update local state
            setOrganizations(prev => prev.filter(o => o.id !== editingOrgId));

            // If current entry selected this org, deselect it
            if (editingEntry?.organizationId === editingOrgId) {
                setEditingEntry({ ...editingEntry, organizationId: null });
            }

            // Reset UI
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
        const orgId = editingEntry?.organizationId;
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
                filters: [{
                    name: 'Image',
                    extensions: ['png', 'jpg', 'jpeg', 'svg', 'webp']
                }]
            });

            if (selected && typeof selected === 'string') {
                setNewOrgLogo(selected);
            }
        } catch (e) {
            console.error("File selection failed", e);
        }
    };

    // Helper to render logo (handles both http urls and local paths)
    const renderLogoSrc = (url: string) => {
        if (!url) return "";
        if (url.startsWith('http')) return url;
        try {
            return convertFileSrc(url);
        } catch (e) {
            return url;
        }
    };

    const createNew = () => {
        const contactId = crypto.randomUUID();
        const relationshipId = crypto.randomUUID();

        const newContact: Contact = {
            id: contactId,
            displayName: "",
            email: "",
            phone: "",
            organizationId: null,
            title: "",
            firstName: null,
            lastName: null,
            notesMd: null,
            thinkingPreference: null,
            primaryBuyInPriority: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const isInternalMode = viewMode === "INTERNAL";

        const newEntry: ProtemoiWithDetails = {
            id: relationshipId,
            contactId: contactId,
            relationshipStage: "TARGET",
            protemoiType: isInternalMode ? "SPONSOR_ADVOCATE" : "CLIENT_OR_PROSPECT",
            nextStepText: "",
            nextStepDueDate: null,
            lastTouchDate: null,
            nextTouchDate: null,
            importanceScore: 0,
            organizationId: null,
            isInternal: isInternalMode,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            contact: newContact
        };

        setNewOrgName("");
        setNewOrgLogo("");
        setShowNewOrgInput(false);
        setEditingEntry(newEntry);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center h-[70px] px-6 border-b border-white/5 bg-base sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold m-0 tracking-tight">Relationship Board</h2>
                    <select
                        className="input"
                        value={viewMode}
                        onChange={e => setViewMode(e.target.value as any)}
                        style={{ minWidth: "150px", fontWeight: "bold" }}
                    >
                        <option value="EXTERNAL">External</option>
                        <option value="INTERNAL">Internal</option>
                    </select>
                </div>
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
                    <button className="btn btn-primary" onClick={createNew}>New Relationship</button>
                </div>
            </div>

            <div style={{ display: "flex", gap: "16px", padding: "24px", flex: 1, overflowX: "auto" }}>
                {activeStages.map(stage => {
                    const stageEntries = filteredEntries.filter(e => e.relationshipStage === stage);

                    return (
                        <div key={stage} style={{ minWidth: "320px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "12px", display: "flex", flexDirection: "column" }}>
                            <div className="flex justify-between items-center p-4 border-b border-white/5">
                                <h4 style={{ margin: 0, color: "hsl(var(--color-text-muted))", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                                    {stage.replace(/_/g, " ")}
                                </h4>
                                <span className="bg-base rounded-full px-2 py-0.5 text-xs text-muted">{stageEntries.length}</span>
                            </div>

                            <div className="flex flex-col gap-3 p-4 custom-scrollbar" style={{ overflowY: "auto", flex: 1 }}>
                                {stageEntries.map(entry => (
                                    <div
                                        key={entry.id}
                                        className="card hover:border-primary-hover cursor-pointer group relative overflow-hidden flex-shrink-0"
                                        style={{
                                            padding: "16px",
                                            minHeight: "120px", // Ensure minimum height for logo
                                            backgroundColor: getPreferenceColor(entry.contact?.thinkingPreference),
                                            color: getPreferenceTextColor(entry.contact?.thinkingPreference)
                                        }}
                                        onClick={() => setEditingEntry(entry)}
                                    >
                                        {/* Company Logo in Top Right */}
                                        {entry.organization?.logoUrl && !isAnonymized && (
                                            <div
                                                className="mb-8 rounded p-0 overflow-hidden flex items-start justify-start z-10 transition-transform hover:scale-105"
                                                style={{ width: '128px', height: 'auto', marginBottom: '10px' }}
                                                title={entry.organization.name}
                                            >
                                                <img
                                                    src={renderLogoSrc(entry.organization.logoUrl)}
                                                    alt={entry.organization.name}
                                                    className="object-contain" // Keep object-contain class just in case but also force style
                                                    style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                                />
                                            </div>
                                        )}
                                        <div style={{ fontWeight: "600", fontSize: "15px", marginBottom: "4px" }}>
                                            {isAnonymized ? `Person ${entries.indexOf(entry) + 1}` : (entry.contact?.displayName || "Unknown Contact")}
                                        </div>
                                        <div className="text-xs uppercase tracking-wide mb-2 opacity-80" style={{ paddingRight: "40px" }}>
                                            {entry.organization?.name ? (
                                                <div className="font-semibold truncate mb-0.5" title={isAnonymized ? "Anonymized Organization" : entry.organization.name}>
                                                    {isAnonymized ? `Organization ${entries.indexOf(entry) + 1}` : entry.organization.name}
                                                </div>
                                            ) : null}
                                            <div className="opacity-75">{entry.protemoiType?.replace(/_/g, " ")}</div>
                                        </div>

                                        {entry.contact?.linkedinUrl && (
                                            <div
                                                className="absolute bottom-3 right-3 w-6 h-6 p-1 rounded-full hover:bg-black/10 transition-colors z-20 cursor-pointer text-blue-600 hover:text-blue-700 bg-white/80"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(entry.contact!.linkedinUrl!, "_blank");
                                                }}
                                                title="Open LinkedIn Profile"
                                            >
                                                <LinkedInIcon />
                                            </div>
                                        )}

                                        {entry.nextStepText && (
                                            <div style={{
                                                fontSize: "13px",
                                                padding: "8px 10px",
                                                backgroundColor: "rgba(255,255,255,0.04)",
                                                borderRadius: "6px",
                                                borderLeft: "3px solid hsl(var(--color-primary))",
                                                marginTop: "auto" // Push to bottom
                                            }}>
                                                <span className="text-xs text-muted block mb-1">Next Step:</span>
                                                {entry.nextStepText}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {editingEntry && (
                <>
                    <Modal
                        isOpen={!!editingEntry}
                        onClose={() => setEditingEntry(null)}
                        title={editingEntry.contact?.displayName ? "Edit Relationship" : "New Relationship"}
                        footer={
                            <>
                                <button className="btn btn-ghost text-error" onClick={handleDelete} style={{ marginRight: "auto", color: "hsl(var(--color-text-error, #f87171))" }}>Delete</button>
                                <button className="btn btn-ghost" onClick={() => setEditingEntry(null)}>Cancel</button>
                                <button className="btn" onClick={handleSave}>Save</button>
                            </>
                        }
                    >
                        <div className="flex flex-col gap-6">
                            {/* Scope Toggle */}
                            <div className="flex justify-center bg-base-200 p-1 rounded-lg self-center">
                                <button
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${!editingEntry.isInternal ? 'bg-primary text-white shadow' : 'text-muted hover:text-white'}`}
                                    onClick={() => setEditingEntry({
                                        ...editingEntry,
                                        isInternal: false,
                                        protemoiType: "CLIENT_OR_PROSPECT",
                                        relationshipStage: "TARGET"
                                    })}
                                >
                                    External
                                </button>
                                <button
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${editingEntry.isInternal ? 'bg-primary text-white shadow' : 'text-muted hover:text-white'}`}
                                    onClick={() => setEditingEntry({
                                        ...editingEntry,
                                        isInternal: true,
                                        protemoiType: "SPONSOR_ADVOCATE",
                                        relationshipStage: "TARGET"
                                    })}
                                >
                                    Internal
                                </button>
                            </div>

                            {/* MIT Creation Link */}
                            {editingEntry.id && (
                                <div className="flex justify-end -mt-2 mb-2">
                                    <button className="btn btn-xs btn-outline" onClick={() => setShowMITModal(true)}>
                                        Create MIT for this
                                    </button>
                                </div>
                            )}

                            <div className="p-4 bg-base-200 rounded-lg border border-white/5">
                                <h4 className="mb-3 font-bold text-base-content text-sm uppercase tracking-wide opacity-70">Company Details</h4>
                                <div className="flex flex-col gap-3">
                                    {!showNewOrgInput ? (
                                        <div className="flex items-end gap-2">
                                            <label className="flex flex-col gap-1 flex-1">
                                                <span className="text-xs font-medium text-muted">Organization</span>
                                                <select
                                                    className="input"
                                                    value={editingEntry.organizationId || ""}
                                                    onChange={e => setEditingEntry({
                                                        ...editingEntry,
                                                        organizationId: e.target.value || null
                                                    })}
                                                >
                                                    <option value="">Select Organization...</option>
                                                    {organizations.map(org => (
                                                        <option key={org.id} value={org.id}>{org.name}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            {/* Edit Button (only if org selected) */}
                                            <button
                                                className="btn btn-square btn-ghost"
                                                title="Edit Selected Company"
                                                disabled={!editingEntry.organizationId}
                                                onClick={startEditingOrg}
                                            >
                                                ✎
                                            </button>
                                            {/* Create Button */}
                                            <button
                                                className="btn btn-square"
                                                title="Add New Company"
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
                                                    value={newOrgName}
                                                    onChange={e => setNewOrgName(e.target.value)}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        className="input text-sm flex-1"
                                                        placeholder="Logo URL or File Path"
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

                            <div className="p-4 bg-base-200 rounded-lg border border-white/5">
                                <h4 className="mb-3 font-bold text-base-content text-sm uppercase tracking-wide opacity-70">Contact Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex flex-col gap-1 col-span-2">
                                        <span className="text-xs font-medium text-muted">Full Name</span>
                                        <input
                                            className="input"
                                            value={editingEntry.contact?.displayName || ""}
                                            onChange={e => setEditingEntry({
                                                ...editingEntry,
                                                contact: { ...editingEntry.contact!, displayName: e.target.value }
                                            })}
                                            placeholder="e.g. Jane Doe"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1 col-span-2">
                                        <span className="text-xs font-medium text-muted">Thinking Style</span>
                                        <select
                                            className="input"
                                            value={editingEntry.contact?.thinkingPreference || ""}
                                            onChange={e => setEditingEntry({
                                                ...editingEntry,
                                                contact: { ...editingEntry.contact!, thinkingPreference: e.target.value ? e.target.value as ThinkingPreference : null }
                                            })}
                                        >
                                            <option value="">None</option>
                                            {ThinkingPreference.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-muted">Email</span>
                                        <input
                                            className="input"
                                            value={editingEntry.contact?.email || ""}
                                            onChange={e => setEditingEntry({
                                                ...editingEntry,
                                                contact: { ...editingEntry.contact!, email: e.target.value }
                                            })}
                                            placeholder="jane@example.com"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-muted">Phone</span>
                                        <input
                                            className="input"
                                            value={editingEntry.contact?.phone || ""}
                                            onChange={e => setEditingEntry({
                                                ...editingEntry,
                                                contact: { ...editingEntry.contact!, phone: e.target.value }
                                            })}
                                            placeholder="+1 234 567 890"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-muted">LinkedIn URL</span>
                                        <input
                                            className="input"
                                            value={editingEntry.contact?.linkedinUrl || ""}
                                            onChange={e => setEditingEntry({
                                                ...editingEntry,
                                                contact: { ...editingEntry.contact!, linkedinUrl: e.target.value }
                                            })}
                                            placeholder="https://linkedin.com/in/..."
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-muted">Title</span>
                                        <input
                                            className="input"
                                            value={editingEntry.contact?.title || ""}
                                            onChange={e => setEditingEntry({
                                                ...editingEntry,
                                                contact: { ...editingEntry.contact!, title: e.target.value }
                                            })}
                                            placeholder="CEO"
                                        />
                                    </label>
                                </div>
                            </div>

                            <details className="bg-base-200 rounded-lg border border-white/5 group">
                                <summary className="p-4 font-bold text-base-content text-sm uppercase tracking-wide opacity-70 cursor-pointer list-none flex justify-between items-center bg-base-300 rounded-lg hover:bg-base-100 transition-colors">
                                    Personal Details
                                    <span className="opacity-50 text-xs">▼</span>
                                </summary>
                                <div className="p-4 grid grid-cols-2 gap-4 border-t border-white/5">
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-muted">Location</span>
                                        <input
                                            className="input"
                                            value={editingEntry.contact?.location || ""}
                                            onChange={e => setEditingEntry({
                                                ...editingEntry,
                                                contact: { ...editingEntry.contact!, location: e.target.value }
                                            })}
                                            placeholder="City, Country"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-muted">Marital Status</span>
                                        <input
                                            className="input"
                                            value={editingEntry.contact?.maritalStatus || ""}
                                            onChange={e => setEditingEntry({
                                                ...editingEntry,
                                                contact: { ...editingEntry.contact!, maritalStatus: e.target.value }
                                            })}
                                            placeholder="Married, Single..."
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1 col-span-2">
                                        <span className="text-xs font-medium text-muted">Children</span>
                                        <input
                                            className="input"
                                            value={editingEntry.contact?.children || ""}
                                            onChange={e => setEditingEntry({
                                                ...editingEntry,
                                                contact: { ...editingEntry.contact!, children: e.target.value }
                                            })}
                                            placeholder="Names, ages..."
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1 col-span-2">
                                        <span className="text-xs font-medium text-muted">Hobbies</span>
                                        <textarea
                                            className="input"
                                            rows={2}
                                            value={editingEntry.contact?.hobbiesInterests || ""}
                                            onChange={e => setEditingEntry({
                                                ...editingEntry,
                                                contact: { ...editingEntry.contact!, hobbiesInterests: e.target.value }
                                            })}
                                            placeholder="Golf, Reading, Cooking..."
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1 col-span-2">
                                        <span className="text-xs font-medium text-muted">Career & Professional Background</span>
                                        <textarea
                                            className="input"
                                            rows={3}
                                            value={editingEntry.contact?.careerHistory || ""}
                                            onChange={e => setEditingEntry({
                                                ...editingEntry,
                                                contact: { ...editingEntry.contact!, careerHistory: e.target.value }
                                            })}
                                            placeholder="Past roles, key achievements..."
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1 col-span-2">
                                        <span className="text-xs font-medium text-muted">Education</span>
                                        <textarea
                                            className="input"
                                            rows={2}
                                            value={editingEntry.contact?.education || ""}
                                            onChange={e => setEditingEntry({
                                                ...editingEntry,
                                                contact: { ...editingEntry.contact!, education: e.target.value }
                                            })}
                                            placeholder="University, degrees..."
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1 col-span-2">
                                        <span className="text-xs font-medium text-muted">What's on their mind right now?</span>
                                        <textarea
                                            className="input"
                                            rows={2}
                                            value={editingEntry.contact?.currentFocus || ""}
                                            onChange={e => setEditingEntry({
                                                ...editingEntry,
                                                contact: { ...editingEntry.contact!, currentFocus: e.target.value }
                                            })}
                                            placeholder="Current focus, concerns, or interests..."
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1 col-span-2">
                                        <span className="text-xs font-medium text-muted">Stories & Anecdotes</span>
                                        <textarea
                                            className="input"
                                            rows={3}
                                            value={editingEntry.contact?.storiesAnecdotes || ""}
                                            onChange={e => setEditingEntry({
                                                ...editingEntry,
                                                contact: { ...editingEntry.contact!, storiesAnecdotes: e.target.value }
                                            })}
                                            placeholder="Interesting stories or memorable moments..."
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1 col-span-2">
                                        <span className="text-xs font-medium text-muted">Other</span>
                                        <textarea
                                            className="input"
                                            rows={2}
                                            value={editingEntry.contact?.other || ""}
                                            onChange={e => setEditingEntry({
                                                ...editingEntry,
                                                contact: { ...editingEntry.contact!, other: e.target.value }
                                            })}
                                            placeholder="Any other details..."
                                        />
                                    </label>
                                </div>
                            </details>

                            <div className="p-4 bg-base-200 rounded-lg border border-white/5">
                                <h4 className="mb-3 font-bold text-base-content text-sm uppercase tracking-wide opacity-70">Relationship Status</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-muted">Stage</span>
                                        <select
                                            className="input"
                                            value={editingEntry.relationshipStage}
                                            onChange={e => setEditingEntry({ ...editingEntry, relationshipStage: e.target.value as any })}
                                        >
                                            {getStagesForEntry(editingEntry.isInternal).map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                                        </select>
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-muted">Type</span>
                                        <select
                                            className="input"
                                            value={editingEntry.protemoiType}
                                            onChange={e => setEditingEntry({ ...editingEntry, protemoiType: e.target.value as any })}
                                        >
                                            {getTypesForEntry(editingEntry.isInternal).map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                                        </select>
                                    </label>
                                    <label className="flex flex-col gap-1 col-span-2">
                                        <span className="text-xs font-medium text-muted">Next Step</span>
                                        <textarea
                                            className="input"
                                            rows={2}
                                            value={editingEntry.nextStepText || ""}
                                            onChange={e => setEditingEntry({ ...editingEntry, nextStepText: e.target.value })}
                                            placeholder="Discussion topic, action item..."
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Connected Meetings Section */}
                            <details className="bg-base-200 rounded-lg border border-white/5 group mt-4">
                                <summary className="p-4 font-bold text-base-content text-sm uppercase tracking-wide opacity-70 cursor-pointer list-none flex justify-between items-center bg-base-300 rounded-lg hover:bg-base-100 transition-colors">
                                    Connected Meetings ({linkedMeetings.length})
                                    <span className="opacity-50 text-xs">▼</span>
                                </summary>
                                <div className="p-4 border-t border-white/5">
                                    <div className="flex flex-col gap-2">
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
                    </Modal>

                    {/* MIT Modal must be LAST to appear ON TOP */}
                    <MITModal
                        isOpen={showMITModal}
                        onClose={() => setShowMITModal(false)}
                        linkedEntityType="RELATIONSHIP"
                        linkedEntityId={editingEntry!.id}
                    />
                </>
            )
            }
        </div >
    );
}
