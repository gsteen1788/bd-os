import { useEffect, useState } from "react";
import { Meeting, Opportunity } from "../../domain/entities";
import { meetingRepository, opportunityRepository } from "../../infrastructure/repositories";

export function Dashboard() {
    const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

    useEffect(() => {
        meetingRepository.findUpcoming(5).then(setUpcomingMeetings);
        opportunityRepository.findAllByStage("CREATE_CURIOSITY").then(setOpportunities);
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
                <div className="card" style={{ flex: 1 }}>
                    <h3>👋 Good Morning, User</h3>
                    <p className="text-muted">You have {upcomingMeetings.length} meetings today.</p>
                </div>
                <div className="card" style={{ flex: 1 }}>
                    <h3>🏆 Pipeline Health</h3>
                    <p className="text-muted">{opportunities.length} active opportunities in curiosity stage.</p>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="card" style={{ flex: 2 }}>
                    <h3>📅 Upcoming Meetings</h3>
                    <div className="flex flex-col gap-2" style={{ marginTop: "16px" }}>
                        {upcomingMeetings.map(m => (
                            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid hsl(var(--color-border))" }}>
                                <span>{m.title}</span>
                                <span className="text-muted">{new Date(m.startAt!).toLocaleTimeString()}</span>
                            </div>
                        ))}
                        {upcomingMeetings.length === 0 && <p className="text-muted">No upcoming meetings.</p>}
                    </div>
                </div>

                <div className="card" style={{ flex: 1 }}>
                    <h3>💡 Quick Actions</h3>
                    <div className="flex flex-col gap-2" style={{ marginTop: "16px" }}>
                        <button className="btn">Add Contact</button>
                        <button className="btn">Log Meeting</button>
                        <button className="btn">Create Opportunity</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
