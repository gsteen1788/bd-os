import React, { useState, useEffect } from 'react';
import { getDb } from '../../infrastructure/db';
import { ingestLearnings } from '../../utils/learningIngestion';
import { useTheme } from '../../application/ThemeContext';

interface Learning {
    id: number;
    content: string;
    source_file: string;
}

interface OneLearningProps {
    activeTab?: string;
}

export const OneLearning: React.FC<OneLearningProps> = ({ activeTab = 'dashboard' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [learning, setLearning] = useState<Learning | null>(null);
    const [loading, setLoading] = useState(false);
    const [ingesting, setIngesting] = useState(false);
    const { theme } = useTheme();

    const fetchRandomLearning = async () => {
        setLoading(true);
        try {
            const db = await getDb();
            const result = await db.select<Learning[]>("SELECT * FROM learnings ORDER BY RANDOM() LIMIT 1");
            if (result && result.length > 0) {
                setLearning(result[0]);
            } else {
                setLearning({ id: 0, content: "No learnings found. Click 'Refresh' to ingest.", source_file: "System" });
            }
        } catch (error) {
            console.error("Failed to fetch learning:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && !learning) {
            fetchRandomLearning();
        }
    }, [isOpen]);

    const handleToggle = () => {
        if (!isOpen) {
            fetchRandomLearning();
        }
        setIsOpen(!isOpen);
    };

    const handleIngest = async () => {
        setIngesting(true);
        try {
            await ingestLearnings();
            await fetchRandomLearning();
        } catch (error) {
            console.error("Ingestion failed:", error);
            alert("Failed to ingest learnings. Check console.");
        } finally {
            setIngesting(false);
        }
    };

    const getIconPath = () => {
        switch (theme) {
            case 'kings-quest':
                return '/icons/kq-lightbulb.png';
            case 'solar':
                return '/icons/sl-lightbulb.png';
            case 'dark':
            default:
                return '/icons/cg-lightbulb.png';
        }
    };

    return (
        <div
            className={`fixed right-6 z-50 flex flex-col items-end gap-2 transition-all duration-300`}
            style={{
                bottom: activeTab === 'dashboard' ? 'calc(var(--admin-bar-height, 0px) + 24px)' : '24px'
            }}
        >
            {/* Popup Bubble */}
            {isOpen && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-sm mb-2 animate-in slide-in-from-bottom-5 fade-in duration-300 relative">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        ✕
                    </button>

                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                        <img src={getIconPath()} alt="Lightbulb" className="w-4 h-4 object-contain" />
                        One Learning
                        {learning?.source_file && (
                            <span className="text-xs font-normal opacity-70">from {learning.source_file}</span>
                        )}
                    </h3>

                    <div className="text-gray-800 dark:text-gray-100 text-base leading-relaxed">
                        {loading ? (
                            <span className="animate-pulse">Finding a nugget of wisdom...</span>
                        ) : (
                            learning?.content
                        )}
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={fetchRandomLearning}
                            className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                        >
                            Another one
                        </button>
                        <button
                            onClick={handleIngest}
                            disabled={ingesting}
                            className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            {ingesting ? "Ingesting..." : "Refresh/Ingest"}
                        </button>
                    </div>

                    {/* Triangle pointer */}
                    <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 transform rotate-45"></div>
                </div>
            )}

            {/* Trigger Button */}
            <button
                onClick={handleToggle}
                className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 overflow-hidden ${isOpen
                    ? 'bg-gray-200 rotate-180'
                    : 'bg-transparent hover:scale-110'
                    }`}
                style={{
                    // Override background for icon visibility if needed, or rely on the image.
                    // The icon itself is the button content now.
                    // If we want the button to have a background color AND the icon, we can keep classes.
                    // But usually these specific icons are full illustrations.
                    // Let's check the previous specific request: "colour it to the theme appropriately"
                    // If the icons are transparent PNGs, they might need a background.
                    // If they are full circle buttons, we should remove the background color.
                    // Looking at other icons (kq-settings.png etc), they seem to be standalone images.
                    // I will remove the background color logic and just show the image, 
                    // or keep a subtle background if it's just a glyph.
                    // The prompt says "cg-lightbulb.png" etc. safe to assume they are main visual.
                    // However, the original button had `bg-blue-600`.
                    // Let's try to make the button background transparent so the icon pops, 
                    // or keep a neutral one. 
                    // Actually, for "Cosmic Glass" vs "Kings Quest", the button style itself might change.
                    // Let's stick to showing the image clearly.
                    // I will make the button background transparent and just show the large icon.
                }}
                title="Get a business development tip"
            >
                {isOpen ? (
                    <span className="text-2xl text-gray-600">✕</span>
                ) : (
                    <img
                        src={getIconPath()}
                        alt="Get Learning"
                        className="w-full h-full object-contain"
                    />
                )}
            </button>
        </div>
    );
};
