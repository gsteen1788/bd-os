import { useState, useEffect } from 'react';
import { graphService, GraphEvent } from '../../services/graphService';
import { OutlookConnect } from './OutlookConnect';
import { authService } from '../../services/authService';
import { Modal } from './Modal';

export const CalendarWidget = () => {
    const [events, setEvents] = useState<GraphEvent[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newEventSubject, setNewEventSubject] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [showConnectModal, setShowConnectModal] = useState(false);

    // Check auth and refresh events periodically
    useEffect(() => {
        const checkAuth = async () => {
            const isAuth = authService.isAuthenticated();
            setIsAuthenticated(isAuth);
            if (isAuth) {
                fetchEvents();
            }
        };

        checkAuth();
        // Simple polling to keep UI in sync if auth state changes elsewhere
        const interval = setInterval(checkAuth, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const data = await graphService.getCalendarEvents();
            setEvents(data);
        } catch (error) {
            console.error("Failed to fetch events", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEventSubject.trim()) return;

        setIsCreating(true);
        try {
            // Default to meeting starting at the next full hour
            const now = new Date();
            now.setMinutes(0, 0, 0);
            now.setHours(now.getHours() + 1);

            const end = new Date(now);
            end.setHours(end.getHours() + 1);

            await graphService.createEvent(newEventSubject, now, end);
            setNewEventSubject('');
            fetchEvents(); // Refresh list
        } catch (error) {
            console.error("Failed to create event", error);
        } finally {
            setIsCreating(false);
        }
    };

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <>
            <div className="bg-base-200 rounded-xl overflow-hidden flex flex-col h-full">
                {/* Header removed as it is now in the Modal */}
                <div className="p-4 flex gap-2 justify-end border-b border-[hsl(var(--color-border))] bg-base-300/50">
                    {isAuthenticated && (
                        <button
                            onClick={fetchEvents}
                            disabled={loading}
                            className="btn btn-ghost btn-xs text-muted hover:text-primary transition-colors"
                            title="Refresh Events"
                        >
                            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 4v6h-6M1 20v-6h6" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={() => setShowConnectModal(true)}
                        className={`btn btn-xs ${isAuthenticated ? 'btn-ghost text-success' : 'btn-ghost text-muted hover:text-primary'}`}
                        title={isAuthenticated ? "Connected" : "Connect Outlook"}
                    >
                        {isAuthenticated ? (
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        )}
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto min-h-[300px] custom-scrollbar">
                    {!isAuthenticated ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted opacity-60">
                            <span className="text-4xl mb-4">📴</span>
                            <p>Not Connected</p>
                            <button onClick={() => setShowConnectModal(true)} className="text-xs text-primary hover:underline mt-2">Connect Account</button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Quick Add */}
                            <form onSubmit={handleCreateEvent} className="relative">
                                <input
                                    type="text"
                                    value={newEventSubject}
                                    onChange={(e) => setNewEventSubject(e.target.value)}
                                    placeholder="New meeting subject..."
                                    className="w-full pl-4 pr-12 py-2 rounded-lg border border-[hsl(var(--color-border))] bg-base-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm text-main placeholder:text-muted"
                                />
                                <button
                                    type="submit"
                                    disabled={isCreating || !newEventSubject}
                                    className="absolute right-1 top-1 bottom-1 px-3 bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50 text-xs font-bold transition-colors"
                                >
                                    {isCreating ? '...' : 'ADD'}
                                </button>
                            </form>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Upcoming Events</h4>

                                {events.length === 0 && !loading ? (
                                    <p className="text-sm text-dim italic text-center py-4">No upcoming events found.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {events.map((event) => (
                                            <div key={event.id} className="group p-3 rounded-lg border border-[hsl(var(--color-border))] hover:border-primary/50 bg-base-100 transition-all flex gap-3 items-start">
                                                <div className="flex flex-col items-center min-w-[3rem] p-1 bg-base-200 rounded border border-[hsl(var(--color-border))]">
                                                    <span className="text-[10px] uppercase font-bold text-error">{formatDate(event.start.dateTime).split(',')[0]}</span>
                                                    <span className="text-lg font-bold text-main">{new Date(event.start.dateTime).getDate()}</span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-main truncate" title={event.subject}>
                                                        {event.subject}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted mt-1">
                                                        <span className="flex items-center gap-1">
                                                            🕒 {formatTime(event.start.dateTime)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={showConnectModal}
                onClose={() => setShowConnectModal(false)}
                title="Microsoft Outlook Integration"
            >
                <OutlookConnect />
            </Modal>
        </>
    );
};
