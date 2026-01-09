export function MeetingCalendar() {
    return (
        <div className="card" style={{ height: "400px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <h2 style={{ color: "hsl(var(--color-text-muted))" }}>🚧 Meeting Calendar</h2>
            <p>This feature will allow scheduling and running Meeting Prep templates.</p>
            <button className="btn" style={{ marginTop: "16px" }}>Schedule Meeting</button>
        </div>
    );
}
