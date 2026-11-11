const { radii } = require('./src/theme/tokens.json')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  // NativeWind aplica la clase .dark según useColorScheme() del sistema
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semánticos — cambian solos con dark/light via CSS vars
        bg: 'rgb(var(--color-bg)      / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        sr: 'rgb(var(--color-sr)      / <alpha-value>)',
        sh: 'rgb(var(--color-sh)      / <alpha-value>)',
        border: 'rgb(var(--color-border)  / <alpha-value>)',
        text: 'rgb(var(--color-text)    / <alpha-value>)',
        t2: 'rgb(var(--color-t2)      / <alpha-value>)',
        t3: 'rgb(var(--color-t3)      / <alpha-value>)',
        accent: 'rgb(var(--color-accent)  / <alpha-value>)',
        'on-accent': 'rgb(var(--color-on-accent) / <alpha-value>)',
        star: 'rgb(var(--color-star)    / <alpha-value>)',

        // Feedback — se resuelve desde las variables generadas por tokens.json
        success: 'rgb(var(--color-success) / <alpha-value>)',
        error: 'rgb(var(--color-error)   / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',

        // Status — se resuelve desde las variables generadas por tokens.json
        status: {
          reading: 'rgb(var(--color-status-reading)   / <alpha-value>)',
          read: 'rgb(var(--color-status-read)      / <alpha-value>)',
          want: 'rgb(var(--color-status-want)      / <alpha-value>)',
          abandoned: 'rgb(var(--color-status-abandoned) / <alpha-value>)'
        }
      },

      fontFamily: {
        // Display — fuente de títulos y headings
        display: ['Newsreader_400Regular', 'serif'],
        'display-i': ['Newsreader_400Regular_Italic', 'serif'],
        'display-sb': ['Newsreader_600SemiBold', 'serif'],
        'display-bold': ['Newsreader_700Bold', 'serif'],

        // Body — fuente de texto corriente
        body: ['Inter_400Regular', 'sans-serif'],
        'body-light': ['Inter_300Light', 'sans-serif'],
        'body-md': ['Inter_500Medium', 'sans-serif'],
        'body-sb': ['Inter_600SemiBold', 'sans-serif'],
        'body-bold': ['Inter_700Bold', 'sans-serif']
      },

      fontSize: {
        xs: [12, { lineHeight: '16px' }],
        sm: [14, { lineHeight: '20px' }],
        base: [16, { lineHeight: '24px' }],
        md: [18, { lineHeight: '26px' }],
        lg: [22, { lineHeight: '28px' }],
        xl: [28, { lineHeight: '36px' }],
        '2xl': [32, { lineHeight: '40px' }],
        '3xl': [36, { lineHeight: '44px' }]
      },

      letterSpacing: {
        tight: '-0.02em',
        normal: '0em',
        wide: '0.05em',
        wider: '0.10em',
        widest: '0.16em'
      },

      // Una fuente de verdad para la geometría de todos los componentes.
      borderRadius: radii,

      spacing: {
        // Padding horizontal de contenedor principal (18px)
        container: '16px',
        // gap-4.5 = 18px (entre gap-4/16px y gap-5/20px)
        4.5: '18px'
      }
    }
  },
  plugins: []
}
