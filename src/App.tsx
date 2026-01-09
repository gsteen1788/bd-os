import { useState } from 'react';
import { Layout } from './ui/Layout';
import { Dashboard } from './ui/screens/Dashboard';
import { OpportunityBoard } from './ui/screens/OpportunityBoard';
import { MeetingPrep } from './ui/screens/MeetingPrep';
import { ProtemoiBoard } from './ui/screens/ProtemoiBoard';

function App() {
    const [activeTab, setActiveTab] = useState("dashboard");

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
        <Layout activeTab={activeTab} onTabChange={setActiveTab}>
            {renderContent()}
        </Layout>
    );
}

export default App;
