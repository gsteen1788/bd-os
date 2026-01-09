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
        <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
            {/* Sidebar */}
            <aside style={{
                width: "240px",
                backgroundColor: "hsl(var(--color-bg-surface))",
                borderRight: "1px solid hsl(var(--color-border))",
                display: "flex",
                flexDirection: "column",
                padding: "var(--space-4)"
            }}>
                <div style={{ marginBottom: "var(--space-5)", paddingLeft: "var(--space-2)" }}>
                    <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "hsl(var(--color-primary))" }}>BD OS</h2>
                    <p className="text-muted" style={{ fontSize: "12px", margin: 0 }}>Alpha Build</p>
                </div>

                <nav className="flex flex-col gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={activeTab === tab.id ? "btn" : "btn-ghost"}
                            style={{ justifyContent: "flex-start", textAlign: "left", display: "flex", alignItems: "center", gap: "10px" }}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, overflow: "auto", position: "relative" }}>
                <header style={{
                    height: "60px",
                    borderBottom: "1px solid hsl(var(--color-border))",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 var(--space-4)",
                    justifyContent: "space-between"
                }}>
                    <h1 style={{ fontSize: "18px", margin: 0 }}>
                        {tabs.find(t => t.id === activeTab)?.label}
                    </h1>
                    <div className="flex items-center gap-4">
                        <input type="text" placeholder="Search..." style={{ width: "200px" }} />
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "hsl(var(--color-bg-surface))" }}></div>
                    </div>
                </header>

                <div style={{ padding: "var(--space-4)", maxWidth: "1200px", margin: "0 auto" }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
