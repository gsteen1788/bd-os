
import { useState, useEffect } from "react";
import { EvaluationResult } from "../../infrastructure/ai/geminiService";
import { useTheme } from "../../application/ThemeContext";
import { open } from "@tauri-apps/api/dialog";
import { convertFileSrc } from "@tauri-apps/api/tauri";

interface EvaluationModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: EvaluationResult | null;
    isLoading: boolean;
    onUseAnyway: () => void;
    onRewrite: () => void;
    type?: 'RELATIONSHIP' | 'OPPORTUNITY' | 'MIT';
}

export function EvaluationModal({ isOpen, onClose, result, isLoading, onUseAnyway, onRewrite, type = 'RELATIONSHIP' }: EvaluationModalProps) {
    const { theme } = useTheme();
    const [customIcon, setCustomIcon] = useState<string | null>(null);

    // Load custom icon for current theme on mount or theme change
    useEffect(() => {
        const saved = localStorage.getItem(`bdos_oracle_icon_${theme}`);
        setCustomIcon(saved);
    }, [theme, isOpen]);

    const handleSelectIcon = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{ name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'] }]
            });

            if (selected && typeof selected === 'string') {
                localStorage.setItem(`bdos_oracle_icon_${theme}`, selected);
                setCustomIcon(selected);
            }
        } catch (e) {
            console.error("Failed to select icon:", e);
        }
    };

    const handleResetIcon = (e: React.MouseEvent) => {
        e.stopPropagation();
        localStorage.removeItem(`bdos_oracle_icon_${theme}`);
        setCustomIcon(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
            <div
                className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[hsl(var(--color-border))] bg-base-100 shadow-2xl transition-all animate-scale-in"
                style={{
                    boxShadow: "0 0 40px -10px rgba(0,0,0,0.1), 0 0 20px -5px rgba(255,255,255,0.05) inset",
                    backgroundColor: "hsl(var(--color-bg-base))",
                    borderColor: "hsl(var(--color-border))"
                }}
            >
                {/* Decorative background glow based on theme primary */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50"></div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 gap-6 text-center group relative">
                        {/* Customize Icon Button (Visible on Hover) */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            {customIcon && (
                                <button
                                    onClick={handleResetIcon}
                                    className="text-xs text-muted hover:text-error underline"
                                    title="Reset to default"
                                >
                                    Reset
                                </button>
                            )}
                            <button
                                onClick={handleSelectIcon}
                                className="p-1 rounded bg-base-200 hover:bg-base-300 text-muted hover:text-main transition-colors border border-[hsl(var(--color-border))]"
                                title="Change Oracle Icon for this theme"
                            >
                                ✏️
                            </button>
                        </div>

                        <div className="relative">
                            {customIcon ? (
                                <div className="w-24 h-24 relative flex items-center justify-center animate-pulse">
                                    <img
                                        src={convertFileSrc(customIcon)}
                                        alt="Oracle"
                                        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(var(--color-primary),0.5)]"
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xl animate-pulse">✨</span>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-medium text-main">Consulting the Oracle</h3>
                            <p className="text-sm text-muted">
                                {type === 'MIT' ? "Checking B.I.G. criteria..." :
                                    type === 'OPPORTUNITY' ? "Evaluating next step validity..." :
                                        "Evaluating trust deposit criteria..."}
                            </p>
                        </div>
                    </div>
                ) : result ? (
                    <div className="flex flex-col">
                        {/* Status Header */}
                        <div className={`p-8 pb-6 flex flex-col items-center text-center border-b border-[hsl(var(--color-border))] relative overflow-hidden`}>
                            {/* Background flush */}
                            <div className={`absolute inset-0 opacity-10 ${result.verdict === "PASS" ? "bg-gradient-to-b from-success to-transparent" : "bg-gradient-to-b from-error to-transparent"}`}></div>

                            <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg ring-1 ring-[hsl(var(--color-border))] ${result.verdict === "PASS" ? "bg-success/20 text-success" : "bg-error/20 text-error"}`}>
                                {result.verdict === "PASS" ? "✓" : "!"}
                            </div>

                            <h2 className={`relative z-10 text-2xl font-bold tracking-tight ${result.verdict === "PASS" ? "text-success" : "text-error"}`}>
                                {result.verdict === "PASS"
                                    ? type === 'MIT' ? "MIT Certified" : "Trust Deposit Verified"
                                    : type === 'MIT' ? "MIT Needs Refinement" : "Next Step Needs Work"}
                            </h2>

                            {result.verdict === "PASS" && result.deposit_type && (
                                <div className="relative z-10 mt-2 px-3 py-1 rounded-full bg-success/10 border border-success/20 text-xs font-semibold uppercase tracking-wider text-success">
                                    {result.deposit_type.replace(/_/g, " ")}
                                </div>
                            )}

                            {/* MIT Specific Criteria Badges */}
                            {type === 'MIT' && result.mit_criteria && (
                                <div className="flex gap-2 mt-3 relative z-10">
                                    <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${result.mit_criteria.big_impact ? 'bg-success/10 border-success/30 text-success' : 'bg-base-300 border-[hsl(var(--color-border))] text-muted decoration-line-through opacity-50'}`}>
                                        Big Impact
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${result.mit_criteria.in_control ? 'bg-success/10 border-success/30 text-success' : 'bg-base-300 border-[hsl(var(--color-border))] text-muted decoration-line-through opacity-50'}`}>
                                        In Control
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${result.mit_criteria.growth_oriented ? 'bg-success/10 border-success/30 text-success' : 'bg-base-300 border-[hsl(var(--color-border))] text-muted decoration-line-through opacity-50'}`}>
                                        Growth Oriented
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Analysis Body */}
                        <div className="p-6 space-y-6 bg-base-200/50">
                            {/* Reason */}
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Analysis</h4>
                                <p className="text-base text-main leading-relaxed font-light">
                                    {result.reason}
                                </p>
                            </div>

                            {/* Improvement Hint (Only if Fail) */}
                            {result.verdict === "FAIL" && result.improvement_hint && (
                                <div className="p-4 rounded-lg bg-warning/5 border border-warning/10">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-warning/80 mb-2 flex items-center gap-1">
                                        💡 Suggestion
                                    </h4>
                                    <p className="text-sm text-warning/90 italic">
                                        "{result.improvement_hint}"
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-4 bg-base-300/30 border-t border-[hsl(var(--color-border))] flex items-center justify-end gap-3">
                            <button
                                className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-main hover:bg-black/5 transition-colors"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            {result.verdict === "FAIL" ? (
                                <>
                                    <button
                                        className="px-4 py-2 rounded-lg text-sm font-medium text-main hover:text-main hover:bg-black/5 transition-colors"
                                        onClick={onUseAnyway}
                                    >
                                        Use Anyway
                                    </button>
                                    <button
                                        className="btn"
                                        onClick={onRewrite}
                                    >
                                        Try Again
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="btn btn-success"
                                    onClick={onUseAnyway}
                                >
                                    Confirm
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="text-error mb-2">⚠</div>
                        <div className="text-muted">Data could not be retrieved.</div>
                        <button className="btn btn-sm btn-ghost mt-4" onClick={onClose}>Close</button>
                    </div>
                )}

                {/* Close X (Absolute) - Hidden in loading to avoid interruption or maybe keep it? Detailed implementation kept it. */}
                {!isLoading && (
                    <button
                        className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-main hover:bg-black/5 transition-colors z-20"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}
