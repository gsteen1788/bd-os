import { useEffect, useState } from "react";
import { taskRepository, trackerGoalRepository } from "../../infrastructure/repositories";
import { getWeekStart } from "../../utils/dateUtils";

interface WeeklyStats {
    weekStart: string;
    bdTasksCount: number;
    bdTaskHours: number;
    internalMeetingHours: number;
    externalMeetingHours: number;
    mitCount: number;
    weekReviewDone: boolean;
}

export function Tracker() {
    const [stats, setStats] = useState<WeeklyStats[]>([]);
    const [goals, setGoals] = useState<Record<string, number>>({});

    // Date Range State
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(0, 1); // Jan 1st of current year
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0]; // Today
    });

    useEffect(() => {
        loadData();
    }, [startDate, endDate]); // Reload when dates change

    const loadData = async () => {
        try {
            const [allTasks, allGoals] = await Promise.all([
                taskRepository.findAllHistory(),
                trackerGoalRepository.findAll()
            ]);

            // Map Goals
            const goalMap: Record<string, number> = {};
            allGoals.forEach((g: any) => goalMap[g.metric] = g.target);
            setGoals(goalMap);

            // Process Weeks
            const weeks: WeeklyStats[] = [];

            // Generate weeks based on date range
            // Start from EndDate (most recent) and go backwards to StartDate
            const end = new Date(endDate);
            const start = new Date(startDate);

            // Align end date to week start (to ensure we capture the full week of the end date if needed, or just strict range)
            // User said "Default should be from the start of the current year"
            // Let's iterate by weeks.

            // We want to show the week containing endDate, down to the week containing startDate.
            const current = new Date(end);

            // Prevent infinite loop safety
            let safety = 0;
            while (current >= start && safety < 1000) {
                const weekStartOfCurrent = getWeekStart(current);
                const weekStr = weekStartOfCurrent.toISOString().split('T')[0];

                // Avoid duplicates if we decrement by days but stay in same week (not happening here as we jump 7 days, but good to check)
                if (!weeks.find(w => w.weekStart === weekStr)) {

                    // Filter tasks for this week
                    const weekStartObj = new Date(weekStr);
                    const nextWeekObj = new Date(weekStr);
                    nextWeekObj.setDate(nextWeekObj.getDate() + 7);

                    const tasksInWeek = allTasks.filter((t: any) => {
                        const d = new Date(t.updatedAt);
                        return d >= weekStartObj && d < nextWeekObj;
                    });

                    // Calculate Stats
                    let bdTasksCount = 0;
                    let bdTaskHours = 0;
                    let internalMeetingHours = 0;
                    let externalMeetingHours = 0;
                    let mitCount = 0;

                    tasksInWeek.forEach((t: any) => {
                        const duration = (t.durationMinutes || 0) / 60; // Convert to hours

                        if (t.type === 'MIT') {
                            mitCount++;
                            if (t.status === 'DONE') {
                                bdTaskHours += duration;
                            }
                        } else if (t.tag === 'BD_TASK') {
                            bdTasksCount++;
                            bdTaskHours += duration;
                        } else if (t.tag === 'BD_INTERNAL_MEETING') {
                            internalMeetingHours += duration;
                        } else if (t.tag === 'BD_EXTERNAL_MEETING') {
                            externalMeetingHours += duration;
                        }
                    });

                    weeks.push({
                        weekStart: weekStr,
                        bdTasksCount,
                        bdTaskHours,
                        internalMeetingHours,
                        externalMeetingHours,
                        mitCount,
                        weekReviewDone: false
                    });
                }

                // Move back 7 days
                current.setDate(current.getDate() - 7);
                safety++;
            }

            setStats(weeks);

        } catch (e) {
            console.error("Failed to load tracker data", e);
        }
    };

    const handleGoalChange = async (metric: string, value: string) => {
        const num = parseFloat(value);
        if (isNaN(num)) return;

        try {
            await trackerGoalRepository.save({
                id: crypto.randomUUID(),
                metric: metric as any,
                target: num,
                updatedAt: new Date().toISOString()
            });
            setGoals(prev => ({ ...prev, [metric]: num }));
        } catch (e) {
            console.error("Failed to save goal", e);
        }
    };

    // Derived stat
    const getTotalHours = (s: WeeklyStats) => s.bdTaskHours + s.internalMeetingHours + s.externalMeetingHours;

    const isWeekSuccessful = (week: WeeklyStats) => {
        const totalHours = getTotalHours(week);

        const goalBdTasks = goals['BD_TASKS'] || 0;
        const goalBdTaskHours = goals['BD_HOURS_TASKS'] || 0; // New Goal Key
        const goalClientHours = goals['BD_HOURS_CLIENT'] || 0;
        const goalInternalHours = goals['BD_HOURS_INTERNAL'] || 0;
        const goalTotalHours = goals['BD_HOURS_TOTAL'] || 0;
        const goalMits = goals['MITS_COMPLETED'] || 0;

        if (goalBdTasks > 0 && week.bdTasksCount < goalBdTasks) return false;
        if (goalBdTaskHours > 0 && week.bdTaskHours < goalBdTaskHours) return false;
        if (goalClientHours > 0 && week.externalMeetingHours < goalClientHours) return false;
        if (goalInternalHours > 0 && week.internalMeetingHours < goalInternalHours) return false;
        if (goalTotalHours > 0 && totalHours < goalTotalHours) return false;
        if (goalMits > 0 && week.mitCount < goalMits) return false;

        return true;
    };

    return (
        <div className="h-full flex flex-col bg-base-100 overflow-hidden font-sans">
            <div className="p-8 pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-main mb-2">
                        Weekly Tracker
                    </h2>
                    <p className="text-muted text-sm font-medium opacity-80 max-w-2xl">
                        Performance against targets.
                    </p>
                </div>

                {/* Date Controls */}
                <div className="flex gap-4 items-center bg-white/5 p-2 rounded-lg border border-white/10">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-muted">From</label>
                        <input
                            type="date"
                            className="input input-xs bg-transparent border-none text-main focus:outline-none"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-muted">To</label>
                        <input
                            type="date"
                            className="input input-xs bg-transparent border-none text-main focus:outline-none"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)} // Logic handles reload
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto px-8 pb-8">
                <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-sm">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="py-4 px-6 font-semibold text-muted uppercase text-[10px] tracking-wider w-32">Week of</th>
                                <th className="py-4 px-4 font-semibold text-muted uppercase text-[10px] tracking-wider text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <span>BD Tasks #</span>
                                        <GoalInput
                                            value={goals['BD_TASKS']}
                                            onChange={(v) => handleGoalChange('BD_TASKS', v)}
                                        />
                                    </div>
                                </th>
                                <th className="py-4 px-4 font-semibold text-muted uppercase text-[10px] tracking-wider text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <span>BD Task Hrs</span>
                                        <GoalInput
                                            value={goals['BD_HOURS_TASKS']}
                                            onChange={(v) => handleGoalChange('BD_HOURS_TASKS', v)}
                                        />
                                    </div>
                                </th>
                                <th className="py-4 px-4 font-semibold text-muted uppercase text-[10px] tracking-wider text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <span>Int BD Hrs</span>
                                        <GoalInput
                                            value={goals['BD_HOURS_INTERNAL']}
                                            onChange={(v) => handleGoalChange('BD_HOURS_INTERNAL', v)}
                                        />
                                    </div>
                                </th>
                                <th className="py-4 px-4 font-semibold text-muted uppercase text-[10px] tracking-wider text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <span>Ext BD Hrs</span>
                                        <GoalInput
                                            value={goals['BD_HOURS_CLIENT']}
                                            onChange={(v) => handleGoalChange('BD_HOURS_CLIENT', v)}
                                        />
                                    </div>
                                </th>
                                <th className="py-4 px-4 font-semibold text-muted uppercase text-[10px] tracking-wider text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <span>Total Hrs</span>
                                        <GoalInput
                                            value={goals['BD_HOURS_TOTAL']}
                                            onChange={(v) => handleGoalChange('BD_HOURS_TOTAL', v)}
                                        />
                                    </div>
                                </th>
                                <th className="py-4 px-4 font-semibold text-muted uppercase text-[10px] tracking-wider text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <span>MITs</span>
                                        <GoalInput
                                            value={goals['MITS_COMPLETED']}
                                            onChange={(v) => handleGoalChange('MITS_COMPLETED', v)}
                                        />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {stats.map(week => {
                                const totalHours = getTotalHours(week);
                                const success = isWeekSuccessful(week);
                                const isCurrentWeek = week.weekStart === getWeekStart(new Date()).toISOString().split('T')[0];

                                // Color logic: 
                                // Neutral default background
                                // Green tint if successful
                                // Red tint if NOT successful (implied else)
                                const rowClass = success
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20'
                                    : 'bg-rose-500/5 hover:bg-rose-500/10';

                                return (
                                    <tr
                                        key={week.weekStart}
                                        className={`transition-colors duration-200 ${rowClass} ${isCurrentWeek ? 'border-l-4 border-l-primary' : ''}`}
                                    >
                                        <td className="py-4 px-6 font-mono text-xs opacity-70 whitespace-nowrap">
                                            {new Date(week.weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            {isCurrentWeek && <span className="ml-2 text-[9px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded">NOW</span>}
                                        </td>
                                        <td className="py-4 px-4 text-center font-medium opacity-80">{week.bdTasksCount}</td>
                                        <td className="py-4 px-4 text-center font-medium opacity-80">{Number(week.bdTaskHours).toFixed(1)}</td>
                                        <td className="py-4 px-4 text-center font-medium opacity-80">{Number(week.internalMeetingHours).toFixed(1)}</td>
                                        <td className="py-4 px-4 text-center font-medium opacity-80">{Number(week.externalMeetingHours).toFixed(1)}</td>
                                        <td className="py-4 px-4 text-center font-bold text-main">{Number(totalHours).toFixed(1)}</td>
                                        <td className="py-4 px-4 text-center font-medium opacity-80">{week.mitCount}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function GoalInput({ value, onChange }: { value: number | undefined, onChange: (val: string) => void }) {
    return (
        <div className="relative group">
            <input
                className="w-10 h-5 text-center text-[10px] font-bold bg-white/5 hover:bg-white/10 focus:bg-white/20 rounded border border-transparent focus:border-primary/50 outline-none transition-all placeholder-white/20 text-main"
                placeholder="-"
                defaultValue={value || ""}
                onBlur={(e) => onChange(e.target.value)}
            />
        </div>
    );
}
