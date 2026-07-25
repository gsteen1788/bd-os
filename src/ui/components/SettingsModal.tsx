import { useState } from "react";
import { Modal } from "./Modal";
import { useTheme, Theme } from "../../application/ThemeContext";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { theme, setTheme } = useTheme();

    const [gbpRate, setGbpRate] = useState(() => localStorage.getItem('exchange_rate_gbp') || '24.0');
    const [usdRate, setUsdRate] = useState(() => localStorage.getItem('exchange_rate_usd') || '19.0');

    const handleRateChange = (currency: string, value: string) => {
        if (currency === 'GBP') {
            setGbpRate(value);
            localStorage.setItem('exchange_rate_gbp', value);
        } else {
            setUsdRate(value);
            localStorage.setItem('exchange_rate_usd', value);
        }
        window.dispatchEvent(new Event('exchange_rates_updated'));
    };

    const themes: { id: Theme; label: string; description: string; colors: string[] }[] = [
        {
            id: 'dark',
            label: 'Cosmic Glass',
            description: 'The default dark aesthetics. Deep space vibes.',
            colors: ['#0f172a', '#6366f1']
        },
        {
            id: 'solar',
            label: 'Solarised Light',
            description: 'Eye-friendly light theme for day work.',
            colors: ['#fdf6e3', '#0097a7']
        },
        {
            id: 'kings-quest',
            label: "King's Quest",
            description: 'Retro medieval adventure style.',
            colors: ['#2e201a', '#fbbf24']
        },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings">
            <div className="space-y-6">
                <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">Appearance</h4>
                    <div className="grid grid-cols-1 gap-4">
                        {themes.map(t => (
                            <button
                                type="button"
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                aria-label={`Select theme: ${t.label}`}
                                className={`
                                    flex items-center gap-4 p-4 rounded-xl border text-left transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none
                                    ${theme === t.id
                                        ? 'border-primary bg-primary/10 ring-1 ring-primary/50'
                                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                    }
                                `}
                            >
                                <div className="flex-shrink-0 w-12 h-12 rounded-lg shadow-sm border border-white/10 overflow-hidden relative">
                                    <div className="absolute inset-0" style={{ backgroundColor: t.colors[0] }}></div>
                                    <div className="absolute bottom-0 right-0 w-8 h-8 rounded-tl-lg" style={{ backgroundColor: t.colors[1] }}></div>
                                </div>
                                <div>
                                    <div className="font-semibold text-main">{t.label}</div>
                                    <div className="text-sm text-muted">{t.description}</div>
                                </div>
                                {theme === t.id && (
                                    <div className="ml-auto text-primary">
                                        ✓
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">Financial Settings</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <label htmlFor="settings-gbp-rate" className="flex flex-col gap-1">
                            <span className="text-xs text-muted">GBP Exchange Rate (to ZAR)</span>
                            <input 
                                id="settings-gbp-rate"
                                type="number" 
                                className="input w-full" 
                                value={gbpRate} 
                                onChange={(e) => handleRateChange('GBP', e.target.value)} 
                                step="0.1" 
                            />
                        </label>
                        <label htmlFor="settings-usd-rate" className="flex flex-col gap-1">
                            <span className="text-xs text-muted">USD Exchange Rate (to ZAR)</span>
                            <input 
                                id="settings-usd-rate"
                                type="number" 
                                className="input w-full" 
                                value={usdRate} 
                                onChange={(e) => handleRateChange('USD', e.target.value)} 
                                step="0.1" 
                            />
                        </label>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
