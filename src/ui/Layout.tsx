import { ReactNode } from "react";

interface LayoutProps {
    children: ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
    const tabs = [
        { id: "dashboard", label: "Dashboard", icon: "📊" },
        { id: "contacts", label: "Relationships", icon: "👥" },
        { id: "opportunities", label: "Opportunities", icon: "💎" },
        { id: "meetings", label: "Meetings", icon: "📅" },
    ];

    return (
        <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "linear-gradient(to bottom right, hsl(222, 15%, 8%), hsl(222, 15%, 12%))" }}>
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
                        background: "linear-gradient(to right, hsl(var(--color-primary)), #a78bfa)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent"
                    }}>
                        BD OS
                    </h2>
                    <p className="text-muted" style={{ fontSize: "12px", marginTop: "4px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Alpha Build</p>
                </div>

                <nav className="flex flex-col gap-2">
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
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
                                <span style={{ fontSize: "1.2em", opacity: isActive ? 1 : 0.7 }}>{tab.icon}</span>
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, overflow: "auto", position: "relative" }}>
                <header className="glass" style={{
                    height: "70px",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 var(--space-6)",
                    justifyContent: "space-between",
                    position: "sticky",
                    top: 0,
                    zIndex: 5
                }}>
                    <h1 style={{ fontSize: "20px", fontWeight: "600", margin: 0, letterSpacing: "-0.01em" }}>
                        {tabs.find(t => t.id === activeTab)?.label}
                    </h1>
                    <div className="flex items-center gap-4">
                        <input
                            className="input"
                            type="text"
                            placeholder="Type to search..."
                            style={{ width: "240px", backgroundColor: "rgba(0,0,0,0.2)" }}
                        />
                        <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, hsl(var(--color-primary)), #a78bfa)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                        }}></div>
                    </div>
                </header>

                <div style={{ padding: "var(--space-6)", maxWidth: "1200px", margin: "0 auto" }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
