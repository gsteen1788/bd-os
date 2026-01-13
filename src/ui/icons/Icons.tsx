import { Theme } from "../../application/ThemeContext";

// Icon props interface for sizing/coloring if needed
interface IconProps {
    className?: string;
}

// ----------------------------------------------------------------------
// PLACE YOUR CUSTOM ICONS HERE
// ----------------------------------------------------------------------

// Dashboard (Main Hub / Castle)
const DashboardIcon = ({ theme }: { theme: Theme }) => {
    if (theme === 'kings-quest') {
        return (
            <img
                src="/icons/kq-dashboard.png"
                alt="Dashboard"
                className="w-full h-full object-contain drop-shadow-sm"
            />
        );
    }
    // Solar Light
    if (theme === 'solar') {
        return (
            <img
                src="/icons/sl-dashboard.png"
                alt="Dashboard"
                className="w-full h-full object-contain drop-shadow-sm"
            />
        );
    }
    // Cosmic Glass (Default / Dark)
    if (theme === 'dark' || !theme) {
        return (
            <img
                src="/icons/cg-dashboard.png"
                alt="Dashboard"
                className="w-full h-full object-contain drop-shadow-sm"
            />
        );
    }

    // Fallback - SVG
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
    );
};

// Relationships (Contacts / Guild)
const RelationshipsIcon = ({ theme }: { theme: Theme }) => {
    if (theme === 'kings-quest') {
        return (
            <img
                src="/icons/kq-relationships.png"
                alt="Relationships"
                className="w-full h-full object-contain drop-shadow-sm"
            />
        );
    }
    if (theme === 'solar') {
        return (
            <img
                src="/icons/sl-relationships.png"
                alt="Relationships"
                className="w-full h-full object-contain drop-shadow-sm"
            />
        );
    }
    if (theme === 'dark' || !theme) {
        return (
            <img
                src="/icons/cg-relationships.png"
                alt="Relationships"
                className="w-full h-full object-contain drop-shadow-sm"
            />
        );
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
    );
};

// Opportunities (Deals / Quests)
const OpportunitiesIcon = ({ theme }: { theme: Theme }) => {
    if (theme === 'kings-quest') {
        return (
            <img
                src="/icons/kq-opportunities.png"
                alt="Opportunities"
                className="w-full h-full object-contain drop-shadow-sm"
            />
        );
    }
    if (theme === 'solar') {
        return (
            <img
                src="/icons/sl-opportunities.png"
                alt="Opportunities"
                className="w-full h-full object-contain drop-shadow-sm"
            />
        );
    }
    if (theme === 'dark' || !theme) {
        return (
            <img
                src="/icons/cg-opportunities.png"
                alt="Opportunities"
                className="w-full h-full object-contain drop-shadow-sm"
            />
        );
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 2l-5.5 9h11z" />
        </svg>
    );
};

// Meetings (Calendar / Scroll)
const MeetingsIcon = ({ theme }: { theme: Theme }) => {
    if (theme === 'kings-quest') {
        return (
            <img
                src="/icons/kq-meetings.png"
                alt="Meetings"
                className="w-full h-full object-contain drop-shadow-sm"
            />
        );
    }
    if (theme === 'solar') {
        return (
            <img
                src="/icons/sl-meetings.png"
                alt="Meetings"
                className="w-full h-full object-contain drop-shadow-sm"
            />
        );
    }
    if (theme === 'dark' || !theme) {
        return (
            <img
                src="/icons/cg-meetings.png"
                alt="Meetings"
                className="w-full h-full object-contain drop-shadow-sm"
            />
        );
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
        </svg>
    );
};

// Settings (Gear / Tools)
const SettingsIcon = ({ theme }: { theme: Theme }) => {
    if (theme === 'kings-quest') {
        return (
            <img
                src="/icons/kq-settings.png"
                alt="Settings"
                className="w-full h-full object-contain drop-shadow-sm"
            />
        );
    }
    if (theme === 'solar') {
        return (
            <img
                src="/icons/sl-settings.png"
                alt="Settings"
                className="w-full h-full object-contain drop-shadow-sm"
            />
        );
    }
    if (theme === 'dark' || !theme) {
        return (
            <img
                src="/icons/cg-settings.png"
                alt="Settings"
                className="w-full h-full object-contain drop-shadow-sm"
            />
        );
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path fillRule="evenodd" d="M11.07 2.08a.75.75 0 01.65.37l1.45 2.51 1.25.13a.75.75 0 01.54.34l1.34 2.32.79 2.5a.75.75 0 01-.16.82l-1.8 1.8.16.82 2.5.79a.75.75 0 01.53.94l-1.34 2.32-.54.34-1.25.13-1.45 2.51a.75.75 0 01-1.29 0l-1.45-2.51-1.25-.13a.75.75 0 01-.54-.34L7.54 17.6l-.79-2.5a.75.75 0 01.16-.82l1.8-1.8-.16-.82-2.5-.79a.75.75 0 01-.53-.94l1.34-2.32.54-.34 1.25-.13 1.45-2.51a.75.75 0 01.64-.37zM12 8a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
        </svg>
    );
};

export const AppIcons = {
    dashboard: DashboardIcon,
    contacts: RelationshipsIcon,
    opportunities: OpportunitiesIcon,
    meetings: MeetingsIcon,
    settings: SettingsIcon
};
