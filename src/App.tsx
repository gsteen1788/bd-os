import { useState, useEffect } from 'react';
import { initDb } from './infrastructure/db';
import { Layout } from './ui/Layout';
import { Dashboard } from './ui/screens/Dashboard';
import { OpportunityBoard } from './ui/screens/OpportunityBoard';
import { MeetingPrep } from './ui/screens/MeetingPrep';
import { ProtemoiBoard } from './ui/screens/ProtemoiBoard';
import { ThemeProvider } from './application/ThemeContext';
import { OneLearning } from './ui/components/OneLearning';

function App() {
    const [activeTab, setActiveTab] = useState("dashboard");

    useEffect(() => {
        console.log("App mounted");
        initDb().catch(console.error);
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard": return <Dashboard />;
            case "contacts": return <ProtemoiBoard />;
            case "opportunities": return <OpportunityBoard />;
            case "meetings": return <MeetingPrep />; // Switched to Prep for demo purposes as requested
            default: return <Dashboard />;
        }
    };

    return (
        <ThemeProvider>
            <Layout activeTab={activeTab} onTabChange={setActiveTab}>
                {renderContent()}
            </Layout>
            <OneLearning activeTab={activeTab} />
        </ThemeProvider>
    );
}

export default App;
