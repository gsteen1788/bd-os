/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                base: {
                    100: 'hsl(var(--color-bg-base) / <alpha-value>)',
                    200: 'hsl(var(--color-bg-surface) / <alpha-value>)',
                    300: 'hsl(var(--color-bg-surface-hover) / <alpha-value>)',
                },
                primary: {
                    DEFAULT: 'hsl(var(--color-primary) / <alpha-value>)',
                    hover: 'hsl(var(--color-primary-hover) / <alpha-value>)',
                    glow: 'hsl(var(--color-primary-glow) / <alpha-value>)',
                },
                muted: 'hsl(var(--color-text-muted) / <alpha-value>)',
                main: 'hsl(var(--color-text-main) / <alpha-value>)',
                dim: 'hsl(var(--color-text-dim) / <alpha-value>)',
                success: 'hsl(var(--color-success) / <alpha-value>)',
                warning: 'hsl(var(--color-warning) / <alpha-value>)',
                error: 'hsl(var(--color-danger) / <alpha-value>)',
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'sans-serif'],
            },
            borderRadius: {
                xl: 'var(--radius-xl)',
            }
        },
    },
    plugins: [],
}
