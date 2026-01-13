import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'solar' | 'kings-quest';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('bd-os-theme');
        return (saved as Theme) || 'dark';
    });

    useEffect(() => {
        localStorage.setItem('bd-os-theme', theme);

        // Remove old classes
        document.documentElement.classList.remove('theme-dark', 'theme-solar', 'theme-kings-quest');

        // Add new class (default 'dark' might not need a class if it's :root, but let's be explicit if we want)
        // If 'dark' is default in :root, we only strictly need classes for others, but consistent naming helps.
        // Let's assume :root is default (dark), and we add overrides.

        if (theme !== 'dark') {
            document.documentElement.classList.add(`theme-${theme}`);
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
