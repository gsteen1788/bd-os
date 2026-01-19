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

    items.forEach(item => {
        const dateVal = item[dateKey];
        if (!dateVal) return;

        const date = new Date(dateVal as string | number | Date);
        const weekStart = getWeekStart(date);
        // Format: "Week of Jan 14, 2024"
        const key = `Week of ${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

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
