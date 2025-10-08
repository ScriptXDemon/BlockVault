module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // Safelist critical style tokens used in JS string maps (prevents purge removing them)
  safelist: [
    // Text / color
    'text-white', 'text-text-primary', 'text-text-secondary', 'text-accent-blue',
    // Gradients / backgrounds
    'bg-gradient-to-r', 'from-accent-blue', 'to-accent-teal',
    'bg-accent-red/80', 'hover:bg-accent-red', 'bg-background-tertiary/60',
    'bg-transparent', 'hover:bg-accent-blue/10',
    // Borders / effects
    'border', 'border-transparent', 'border-border', 'border-accent-red/60', 'border-accent-blue/60',
    'hover:border-accent-blue/60',
    // Hover / active states
    'hover:brightness-110', 'hover:text-accent-blue/90', 'hover:text-accent-blue',
    'active:scale-[.97]',
    // Shadows
    'shadow-glow', 'hover:shadow-[0_0_0_1px_#00C0FF]'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter', 'Urbanist', 'Lexend', 'ui-sans-serif', 'system-ui', 'sans-serif'
        ],
        mono: [
          'IBM Plex Mono', 'Fira Code', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'
        ]
      },
      colors: {
        // Support both the CSS variables and direct color values
        background: {
          DEFAULT: 'hsl(var(--background))',
          primary: '#1A1A2E', // deep charcoal
          secondary: '#2C2C4A', // card bg
          tertiary: '#3A3A5E', // alt card
        },
        foreground: 'hsl(var(--foreground))',
        accent: {
          blue: '#00C0FF',
          teal: '#00E6FF',
          green: '#00FF80',
          red: '#FF6B6B',
        },
        text: {
          primary: '#E0E0E0',
          secondary: '#A0A0A0',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // For gradients, glass, etc.
        glass: 'rgba(44,44,74,0.7)',
        border: {
          DEFAULT: 'hsl(var(--border))',
        },
        ...require('tailwindcss/colors'),
      },
      backgroundImage: {
        'radial-grid': 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.08), transparent 60%)',
        'fade-top': 'linear-gradient(to top, rgba(17,24,39,0) 0%, rgba(17,24,39,0.9) 100%)',
        'glass-gradient': 'linear-gradient(120deg, rgba(44,44,74,0.7) 60%, rgba(58,58,94,0.6) 100%)',
        'card-gradient': 'linear-gradient(120deg, #232347 0%, #2C2C4A 100%)',
      },
      boxShadow: {
        'glow': '0 0 0 1px #00C0FF, 0 2px 12px -2px rgba(0,0,0,0.7)',
        'glass': '0 4px 24px 0 rgba(0,224,255,0.08), 0 1.5px 6px 0 rgba(0,0,0,0.25) inset',
        'neumorph': '4px 4px 16px #181828, -4px -4px 16px #232347',
      },
      borderRadius: {
        'xl': '1.25rem',
        '2xl': '1.5rem',
        'glass': '1.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease both',
        'scale-in': 'scaleIn 0.25s ease both',
        'pulse-glow': 'pulseGlow 1.2s infinite cubic-bezier(.4,0,.6,1)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        scaleIn: { '0%': { opacity:0, transform:'scale(.96)' }, '100%': { opacity:1, transform:'scale(1)' } },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 #00C0FF' },
          '50%': { boxShadow: '0 0 12px 2px #00C0FF' },
        },
      },
      transitionProperty: {
        'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
        'spacing': 'margin, padding',
        'shadow': 'box-shadow',
        'transform': 'transform',
      },
    },
  },
  plugins: [],
};
