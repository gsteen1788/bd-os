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
    const formatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
    const cache = new Map<number, string>();

    items.forEach(item => {
        const dateVal = item[dateKey];
        if (!dateVal) return;

        const date = new Date(dateVal as string | number | Date);
        const weekStart = getWeekStart(date);
        const time = weekStart.getTime();

        let dateStr = cache.get(time);
        if (!dateStr) {
            dateStr = formatter.format(weekStart);
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

// Cached formatters for better performance in render loops
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
const dateFormatter = new Intl.DateTimeFormat();
const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const shortDateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const calendarDateFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const time24hFormatter = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });

export function formatDate(date: Date | string | number): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Invalid Date";
    return dateFormatter.format(d);
}

export function formatTime(date: Date | string | number): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Invalid Date";
    return timeFormatter.format(d);
}

export function formatShortDate(date: Date | string | number): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Invalid Date";
    return shortDateFormatter.format(d);
}

export function formatCalendarDate(date: Date | string | number): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Invalid Date";
    return calendarDateFormatter.format(d);
}

export function formatTime24h(date: Date | string | number): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Invalid Date";
    return time24hFormatter.format(d);
}

export function formatDateTime(date: Date | string | number): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Invalid Date";
    return dateTimeFormatter.format(d);
}
