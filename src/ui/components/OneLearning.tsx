import React, { useState, useEffect } from 'react';
import { getDb } from '../../infrastructure/db';
import { ingestLearnings } from '../../utils/learningIngestion';

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

    return (
        <div className={`fixed right-6 z-50 flex flex-col items-end gap-2 transition-all duration-300 ${activeTab === 'dashboard' ? 'bottom-48' : 'bottom-6'}`}>
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
                        💡 One Learning
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
                className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${isOpen
                    ? 'bg-gray-200 text-gray-600 rotate-180'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-110'
                    }`}
                title="Get a business development tip"
            >
                <span className="text-2xl">💡</span>
            </button>
        </div>
    );
};
