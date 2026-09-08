/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // "The Council" tribunal palette: warm paper + ink, with the
                // vote verdict (agree/disagree) as the only saturated colors —
                // functional, not decorative, since that's the app's core action.
                primary: {
                    DEFAULT: '#C6A15B',
                    foreground: '#12141C',
                },
                gold: {
                    DEFAULT: '#C6A15B',
                    dim: '#8A6F3D',
                },
                // A gold seal reads as "approved," an oxblood stamp reads as
                // "objection" — so agree/disagree alias the same two brand
                // colors rather than introducing a third (generic) traffic-light green.
                agree: {
                    DEFAULT: '#C6A15B',
                    foreground: '#12141C',
                },
                disagree: {
                    DEFAULT: '#A63A34',
                    foreground: '#ffffff',
                },
                'accent-red': '#A63A34',
                ink: '#12141C',
                parchment: '#F2ECDD',
                'background-light': '#F2ECDD',
                'background-dark': '#12141C',
            },
            fontFamily: {
                display: ['var(--font-display)', 'ui-serif', 'serif'],
                sans: ['var(--font-sans)', 'ui-sans-serif', 'sans-serif'],
                mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
            },
            borderRadius: {
                DEFAULT: '0.2rem',
                lg: '0.3rem',
                xl: '0.4rem',
                '2xl': '0.5rem',
                full: '9999px',
            },
            backgroundImage: {
                grain: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
            },
        },
    },
    plugins: [],
};
