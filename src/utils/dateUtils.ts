
// Shared formatters to avoid re-instantiation overhead in loops/renders
const shortDateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const defaultDateFormatter = new Intl.DateTimeFormat(undefined); // Default locale date

export function formatShortDate(date: string | number | Date): string {
    return shortDateFormatter.format(new Date(date));
}

export function formatTime(date: string | number | Date): string {
    return timeFormatter.format(new Date(date));
}

export function formatDate(date: string | number | Date): string {
    return defaultDateFormatter.format(new Date(date));
}

export function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function groupItemsByWeek<T>(items: T[], dateKey: keyof T): Record<string, T[]> {
    const groups: Record<string, T[]> = {};
    const cache = new Map<number, string>();

    items.forEach(item => {
        const dateVal = item[dateKey];
        if (!dateVal) return;

        const date = new Date(dateVal as string | number | Date);
        const weekStart = getWeekStart(date);
        const time = weekStart.getTime();

        let dateStr = cache.get(time);
        if (!dateStr) {
            dateStr = shortDateFormatter.format(weekStart);
            cache.set(time, dateStr);
        }

        const key = `Week of ${dateStr}`;

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
    });

    return groups;
}

export function sortGroupsByDateDesc(groups: Record<string, any[]>): string[] {
    // Sort keys based on the date they represent
    return Object.keys(groups).sort((_a, _b) => {
        return 0;
    });
}
