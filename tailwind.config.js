/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Thai"', '"Space Grotesk"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"IBM Plex Sans Thai"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Dark canvas
        ink: {
          DEFAULT: '#0a0e1a',     // page bg
          900: '#0f1422',         // surface
          800: '#161c2e',         // surface-2 / cards
          700: '#1f2740',         // surface-3
          600: '#2c3454',         // border-strong
          500: '#3d4670',         // border
          400: '#5a648e',         // muted-strong
          300: '#7d87ab',         // muted
          200: '#a5aece',         // text-2
          100: '#d3d9ef',         // text-1
        },
        // Lime green — signature
        lime: {
          DEFAULT: '#c4f04b',
          glow: '#d8ff5f',
          dim: '#8fb52e',
          soft: 'rgba(196, 240, 75, 0.12)',
        },
        // Accents
        coral: '#ff6b5b',
        gold: '#fbbf24',
        sky: '#5eaaff',
      },
      boxShadow: {
        'glow-lime': '0 0 24px rgba(196, 240, 75, 0.25)',
        'glow-lime-lg': '0 0 48px rgba(196, 240, 75, 0.35)',
        'inset-card': 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
}
