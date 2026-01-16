import { ReactNode, useState } from "react";
import { SettingsModal } from "./components/SettingsModal";
import { AppIcons } from "./icons/Icons";
import { useTheme } from "../application/ThemeContext";
import { useGlobalSearch } from "./hooks/useGlobalSearch";
import { useEffect, useRef } from "react";

interface LayoutProps {
    children: ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { theme } = useTheme();
    const { query, setQuery, results, isSearching } = useGlobalSearch();
    const searchRef = useRef<HTMLDivElement>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        setIsSearchOpen(query.length > 0);
    }, [query]);

    // Close search on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const tabs = [
        { id: "dashboard", label: "Dashboard", Icon: AppIcons.dashboard },
        { id: "contacts", label: "Relationships", Icon: AppIcons.contacts },
        { id: "opportunities", label: "Opportunities", Icon: AppIcons.opportunities },
        { id: "meetings", label: "Meetings", Icon: AppIcons.meetings },
    ];

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-base-100 text-main transition-colors duration-300">
            {/* Sidebar with Glassmorphism */}
            <aside className="glass" style={{
                width: "260px",
                borderRight: "1px solid rgba(255,255,255,0.03)",
                display: "flex",
                flexDirection: "column",
                padding: "var(--space-5)",
                zIndex: 10
            }}>
                <div style={{ marginBottom: "var(--space-8)", paddingLeft: "var(--space-2)" }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: "24px",
                        fontWeight: "800",
                        letterSpacing: "-0.03em",
                        background: "linear-gradient(to right, hsl(var(--color-primary)), hsl(var(--color-primary-hover)))",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        width: "fit-content"
                    }}>
                        BD OS
                    </h2>
                    <p className="text-muted" style={{ fontSize: "12px", marginTop: "4px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Alpha Build</p>
                </div>

                <nav className="flex flex-col gap-2">
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        const IconComponent = tab.Icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={isActive ? "btn" : "btn-ghost"}
                                style={{
                                    justifyContent: "flex-start",
                                    textAlign: "left",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "12px 16px",
                                    backgroundColor: isActive ? "hsl(var(--color-primary))" : "transparent",
                                    boxShadow: isActive ? "0 4px 12px var(--color-primary-glow)" : "none"
                                }}
                            >
                                <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center" style={{ opacity: isActive ? 1 : 0.7 }}>
                                    <IconComponent theme={theme} />
                                </span>
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
                <div className="mt-auto">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="btn-ghost"
                        style={{
                            width: "100%",
                            justifyContent: "flex-start",
                            textAlign: "left",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px 16px",
                            marginTop: "auto"
                        }}
                    >
                        <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center" style={{ opacity: 0.7 }}>
                            <AppIcons.settings theme={theme} />
                        </span>
                        Settings
                    </button>
                    <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex flex-col flex-1 h-full overflow-hidden relative">
                <header className="glass" style={{
                    height: "70px",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 var(--space-6)",
                    justifyContent: "space-between",
                    zIndex: 20
                }}>
                    <h1 style={{ fontSize: "20px", fontWeight: "600", margin: 0, letterSpacing: "-0.01em" }}>
                        {tabs.find(t => t.id === activeTab)?.label}
                    </h1>
                    <div className="flex items-center gap-4" style={{ position: "relative" }} ref={searchRef}>
                        <input
                            className="input"
                            type="text"
                            placeholder="Type to search..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => { if (query) setIsSearchOpen(true); }}
                            style={{ width: "240px", backgroundColor: "rgba(0,0,0,0.2)" }}
                        />
                        {isSearchOpen && (
                            <div className="glass" style={{
                                position: "absolute",
                                top: "100%",
                                right: 0, // Align to right or left as needed, container is flex row
                                left: "auto", // Ensure it doesn't stretch weirdly
                                width: "320px",
                                maxHeight: "400px",
                                overflowY: "auto",
                                backgroundColor: "var(--color-base-100)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "8px",
                                padding: "8px",
                                zIndex: 100,
                                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                                marginTop: "8px"
                            }}>
                                {isSearching ? (
                                    <div className="p-4 text-center text-muted">Searching...</div>
                                ) : (
                                    <>
                                        {results.organizations.length > 0 && (
                                            <div className="mb-2">
                                                <div className="text-xs font-bold text-muted uppercase px-2 mb-1">Organizations</div>
                                                {results.organizations.map(org => (
                                                    <div key={org.id} onClick={() => { onTabChange("contacts"); setIsSearchOpen(false); }} className="p-2 hover:bg-white/5 rounded cursor-pointer transition-colors">
                                                        <div className="font-medium">{org.name}</div>
                                                        <div className="text-xs text-muted">{org.industry}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {results.contacts.length > 0 && (
                                            <div className="mb-2">
                                                <div className="text-xs font-bold text-muted uppercase px-2 mb-1">Contacts</div>
                                                {results.contacts.map(c => (
                                                    <div key={c.id} onClick={() => { onTabChange("contacts"); setIsSearchOpen(false); }} className="p-2 hover:bg-white/5 rounded cursor-pointer transition-colors">
                                                        <div className="font-medium">{c.displayName}</div>
                                                        <div className="text-xs text-muted">{c.title}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {results.opportunities.length > 0 && (
                                            <div className="mb-2">
                                                <div className="text-xs font-bold text-muted uppercase px-2 mb-1">Opportunities</div>
                                                {results.opportunities.map(o => (
                                                    <div key={o.id} onClick={() => { onTabChange("opportunities"); setIsSearchOpen(false); }} className="p-2 hover:bg-white/5 rounded cursor-pointer transition-colors">
                                                        <div className="font-medium">{o.name}</div>
                                                        <div className="text-xs text-muted">{o.stage} • {o.status}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {results.meetings.length > 0 && (
                                            <div className="mb-2">
                                                <div className="text-xs font-bold text-muted uppercase px-2 mb-1">Meetings</div>
                                                {results.meetings.map(m => (
                                                    <div key={m.id} onClick={() => { onTabChange("meetings"); setIsSearchOpen(false); }} className="p-2 hover:bg-white/5 rounded cursor-pointer transition-colors">
                                                        <div className="font-medium">{m.title}</div>
                                                        <div className="text-xs text-muted">{m.startAt ? new Date(m.startAt).toLocaleDateString() : 'Unscheduled'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {results.organizations.length === 0 &&
                                            results.contacts.length === 0 &&
                                            results.opportunities.length === 0 &&
                                            results.meetings.length === 0 && (
                                                <div className="p-4 text-center text-muted">No results found.</div>
                                            )}
                                    </>
                                )}
                            </div>
                        )}
                        <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, hsl(var(--color-primary)), #a78bfa)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                        }}></div>
                    </div>
                </header>

                <main className="flex-1 flex flex-col overflow-hidden relative">
                    {children}
                </main>
            </div>
        </div >
    );
}
