import { useEffect, useState, useCallback, useMemo } from "react";
import { Task, Opportunity, ProtemoiEntry, Contact } from "../../domain/entities";
import { taskRepository, opportunityRepository, protemoiRepository, contactRepository } from "../../infrastructure/repositories";
import { MitCard } from "../components/MitCard";
import { MITModal } from "../components/MITModal";
import { AdminTaskBar } from "../components/AdminTaskBar";
import { TaskCompletionModal } from "../components/TaskCompletionModal";
import { EntityType, TaskTag } from "../../domain/enums";
import { useTheme } from "../../application/ThemeContext";

import { groupItemsByWeek } from "../../utils/dateUtils";
import { CalendarWidget } from "../components/CalendarWidget";
import { Modal } from "../components/Modal";
import { logger } from '../../infrastructure/logger';

export function Dashboard() {
    const { theme } = useTheme();
    const [mits, setMits] = useState<Task[]>([]);
    const [adminTasks, setAdminTasks] = useState<Task[]>([]);
    const [adminHistory, setAdminHistory] = useState<Task[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [relationships, setRelationships] = useState<{ entry: ProtemoiEntry, contact: Contact }[]>([]);
    const [viewMode, setViewMode] = useState<"PENDING" | "HISTORY">("PENDING");

    const [showMITModal, setShowMITModal] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [editingMIT, setEditingMIT] = useState<Task | undefined>(undefined);

    // Completion Flow
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [completionTask, setCompletionTask] = useState<Task | undefined>(undefined);

    // Optimization: Memoize grouped history to avoid expensive date operations on every render
    const groupedMits = useMemo(() => groupItemsByWeek(mits, 'updatedAt'), [mits]);

    // Optimization: Pre-compute lookups to avoid O(N*M) scans in child components
    const oppsMap = useMemo(() => new Map(opportunities.map(o => [o.id, o])), [opportunities]);
    const relsMap = useMemo(() => new Map(relationships.map(r => [r.entry.id, r])), [relationships]);

    useEffect(() => {
        loadContextData();
    }, []);

    useEffect(() => {
        loadTasks();
    }, [viewMode]);

    const loadContextData = async () => {
        try {
            const [opps, protemoi, contacts] = await Promise.all([
                opportunityRepository.findAllSummaries(),
                protemoiRepository.findAllSummaries(),
                contactRepository.findAllSummaries()
            ]);

            setOpportunities(opps);

            const contactMap = new Map<string, Contact>();
            contacts.forEach(c => contactMap.set(c.id, c));

            const rels = protemoi.map(p => {
                const contact = contactMap.get(p.contactId);
                return contact ? { entry: p, contact } : null;
            }).filter(Boolean) as { entry: ProtemoiEntry, contact: Contact }[];
            setRelationships(rels);
        } catch (e) {
            logger.error("Failed to load context data", e);
        }
    };

    const loadTasks = useCallback(async () => {
        try {
            // Optimization: Avoid double fetch when viewMode is HISTORY by reusing the history promise
            // Use Summaries to avoid loading large descriptions
            const historyPromise = taskRepository.findHistorySummaries(50);
            const pendingOrHistoryPromise = viewMode === "PENDING" ? taskRepository.findPendingSummaries() : historyPromise;

            const [tasks, history] = await Promise.all([
                pendingOrHistoryPromise,
                historyPromise
            ]) as [Task[], Task[]];

            setMits(tasks.filter(t => t.type !== 'ADMIN'));
            setAdminTasks(tasks.filter(t => t.type === 'ADMIN'));

            // For admin history, we want tasks that are type ADMIN and status DONE/CANCELED
            setAdminHistory(history.filter(t => t.type === 'ADMIN'));

        } catch (e) {
            logger.error("Failed to load dashboard tasks", e);
        }
    }, [viewMode]);

    const handleCreate = () => {
        setEditingMIT(undefined);
        setShowMITModal(true);
    };

    const handleEdit = useCallback(async (task: Task) => {
        try {
            // Always fetch full task to ensure description is present (summaries exclude it)
            const fullTask = await taskRepository.findById(task.id);
            if (fullTask) {
                setEditingMIT(fullTask);
                setShowMITModal(true);
            }
        } catch (e) {
            logger.error("Failed to load full task for editing", e);
            alert("Failed to load task details.");
        }
    }, []);

    const handleCompleteMIT = useCallback(async (task: Task) => {
        setCompletionTask(task);
        setShowCompletionModal(true);
    }, []);

    const handleConfirmCompletion = async (duration: number) => {
        if (!completionTask) return;
        try {
            await taskRepository.save({
                ...completionTask,
                status: 'DONE',
                durationMinutes: duration,
                updatedAt: new Date().toISOString()
            });
            setShowCompletionModal(false);
            setCompletionTask(undefined);
            loadTasks();
        } catch (e) {
            logger.error("Failed to complete task", e);
            alert("Failed to complete task");
        }
    };

    const handleUncompleteMIT = useCallback(async (task: Task) => {
        if (!confirm("Revert this task to Pending?")) return;
        try {
            await taskRepository.save({
                ...task,
                status: 'TODO',
                updatedAt: new Date().toISOString()
            });
            loadTasks();
        } catch (e) {
            logger.error("Failed to uncomplete MIT", e);
            alert("Failed to revert MIT");
        }
    }, [loadTasks]);

    const handleCreateAdminTask = async (title: string, dueDate: string, links: { type: EntityType, id: string }[], tag?: TaskTag | null) => {
        try {
            const taskId = crypto.randomUUID();
            await taskRepository.save({
                id: taskId,
                title,
                status: 'TODO',
                type: 'ADMIN',
                dueDate,
                tag,
                linkedEntityType: links.length > 0 ? links[0].type : "NONE",
                linkedEntityId: links.length > 0 ? links[0].id : null,
                links: links.map(l => ({
                    id: crypto.randomUUID(),
                    taskId,
                    entityType: l.type,
                    entityId: l.id,
                    createdAt: new Date().toISOString()
                })),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            loadTasks();
        } catch (e) {
            logger.error("Failed to create Admin Task", e);
            alert("Failed to create task");
        }
    };

    const handleUpdateAdminTask = async (task: Task) => {
        try {
            // Fetch latest to preserve descriptionMd if missing in 'task' (summary)
            const existing = await taskRepository.findById(task.id);
            const taskToSave = {
                ...task,
                descriptionMd: existing?.descriptionMd ?? task.descriptionMd,
                updatedAt: new Date().toISOString()
            };

            await taskRepository.save(taskToSave);
            loadTasks();
        } catch (e) {
            logger.error("Failed to update Admin Task", e);
            alert("Failed to update task");
        }
    };

    const handleCompleteAdminTask = async (task: Task) => {
        setCompletionTask(task);
        setShowCompletionModal(true);
    };

    const handleDeleteAdminTask = async (task: Task) => {
        if (!confirm("Delete this task?")) return;
        try {
            await taskRepository.save({
                ...task,
                status: 'CANCELED',
                updatedAt: new Date().toISOString()
            });
            loadTasks();
        } catch (e) {
            logger.error("Failed to delete Admin Task", e);
            alert("Failed to delete task");
        }
    };

    const handleRevertAdminTask = async (task: Task) => {
        if (!confirm("Revert this task to Pending?")) return;
        try {
            await taskRepository.save({
                ...task,
                status: 'TODO',
                updatedAt: new Date().toISOString()
            });
            loadTasks();
        } catch (e) {
            logger.error("Failed to revert Admin Task", e);
            alert("Failed to revert task");
        }
    };

    const handleModalClose = () => {
        setShowMITModal(false);
        setEditingMIT(undefined);
    };

    const getMitIcon = () => {
        switch (theme) {
            case 'solar': return '/icons/sl-MIT.png';
            case 'kings-quest': return '/icons/kq-MIT.png';
            case 'dark':
            default: return '/icons/cg-MIT.png';
        }
    };

    return (
        <div className="flex flex-col h-full">
            <MITModal
                isOpen={showMITModal}
                onClose={handleModalClose}
                onSave={loadTasks}
                initialTask={editingMIT}
            />

            <TaskCompletionModal
                isOpen={showCompletionModal}
                onClose={() => {
                    setShowCompletionModal(false);
                    setCompletionTask(undefined);
                }}
                onConfirm={handleConfirmCompletion}
                task={completionTask}
            />

            <div className="flex justify-between items-center h-[70px] px-6 border-b border-[hsl(var(--color-border))] bg-base sticky top-0 z-10">
                <div>
                    <h2 className="text-xl font-semibold m-0 tracking-tight flex items-center gap-2">
                        <img src={getMitIcon()} alt="MIT" className="w-8 h-8 object-contain" />
                        Most Important Tasks
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="btn btn-ghost btn-circle"
                        onClick={() => setShowCalendarModal(true)}
                        title="Open Outlook Calendar"
                        aria-label="Open Outlook Calendar"
                    >
                        <span className="text-xl">📅</span>
                    </button>
                    <select
                        aria-label="Toggle view mode"
                        className="input"
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as "PENDING" | "HISTORY")}
                        style={{ minWidth: "150px", fontWeight: "bold", cursor: "pointer" }}
                    >
                        <option value="PENDING">Active MITs</option>
                        <option value="HISTORY">MIT History</option>
                    </select>
                    <button className="btn btn-primary" onClick={handleCreate}>
                        Create MIT
                    </button>
                </div>
            </div>

            {/* Main Content Area - Full Width */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* MIT Grid */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="grid-mit-cards p-6 overflow-y-auto flex-1 custom-scrollbar min-h-0">
                        {viewMode === 'HISTORY' ? (
                            // History View - Grouped
                            Object.keys(groupedMits).map(weekLabel => (
                                <div key={weekLabel} className="col-span-full mb-2">
                                    <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3 mt-4 border-b border-[hsl(var(--color-border))] pb-1">
                                        {weekLabel}
                                    </h3>
                                    <div className="grid-mit-cards">
                                        {groupedMits[weekLabel].map(mit => (
                                            <MitCard
                                                key={mit.id}
                                                mit={mit}
                                                viewMode={viewMode}
                                                opportunitiesMap={oppsMap}
                                                relationshipsMap={relsMap}
                                                onEdit={handleEdit}
                                                onComplete={handleCompleteMIT}
                                                onRevert={handleUncompleteMIT}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            // Pending View - Flat
                            mits.map(mit => (
                                <MitCard
                                    key={mit.id}
                                    mit={mit}
                                    viewMode={viewMode}
                                    opportunitiesMap={oppsMap}
                                    relationshipsMap={relsMap}
                                    onEdit={handleEdit}
                                    onComplete={handleCompleteMIT}
                                    onRevert={handleUncompleteMIT}
                                />
                            ))
                        )}
                    </div>

                    {mits.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted border-2 border-dashed border-base-300 rounded-xl m-4">
                            <div className="text-6xl mb-6">{viewMode === 'HISTORY' ? '📜' : '🎯'}</div>
                            <p className="text-xl font-medium">{viewMode === 'HISTORY' ? 'No completed MITs found.' : 'No MITs defined yet.'}</p>
                            {viewMode === 'PENDING' && (
                                <>
                                    <p className="text-sm mt-2">What is the one thing you MUST do today?</p>
                                    <button className="btn btn-outline mt-6" onClick={handleCreate}>Set Intentions</button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Admin Task Bar */}
            <AdminTaskBar
                tasks={adminTasks}
                history={adminHistory}
                opportunities={opportunities}
                relationships={relationships}
                opportunitiesMap={oppsMap}
                relationshipsMap={relsMap}
                onCreate={handleCreateAdminTask}
                onComplete={handleCompleteAdminTask}
                onUpdate={handleUpdateAdminTask}
                onDelete={handleDeleteAdminTask}
                onRevert={handleRevertAdminTask}
            />

            {/* Calendar Modal */}
            <Modal
                isOpen={showCalendarModal}
                onClose={() => setShowCalendarModal(false)}
                title="Outlook Calendar"
            >
                <div className="min-h-[400px]">
                    <CalendarWidget />
                </div>
            </Modal>
        </div>
    );
}
