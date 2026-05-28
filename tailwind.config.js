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
        bg:      'rgb(var(--color-bg)      / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        sr:      'rgb(var(--color-sr)      / <alpha-value>)',
        sh:      'rgb(var(--color-sh)      / <alpha-value>)',
        border:  'rgb(var(--color-border)  / <alpha-value>)',
        text:    'rgb(var(--color-text)    / <alpha-value>)',
        t2:      'rgb(var(--color-t2)      / <alpha-value>)',
        t3:      'rgb(var(--color-t3)      / <alpha-value>)',
        accent:  'rgb(var(--color-accent)  / <alpha-value>)',
        star:    'rgb(var(--color-star)    / <alpha-value>)',

        // Feedback — fijos, no cambian con el tema
        success: '#5CAF7E',
        error:   '#C43A3A',
        warning: '#C49A20',

        // Status — fijos, no cambian con el tema
        status: {
          reading:   '#4A96B8',
          read:      '#5CAF7E',
          want:      '#8A6CD8',
          abandoned: '#787068',
        },
      },

      fontFamily: {
        // Display — fuente de títulos y headings 
        'display':      ['PlayfairDisplay_400Regular',         'serif'],
        'display-i':    ['PlayfairDisplay_400Regular_Italic',  'serif'],
        'display-sb':   ['PlayfairDisplay_600SemiBold',        'serif'],
        'display-bold': ['PlayfairDisplay_700Bold',            'serif'],

        // Body — fuente de texto corriente 
        'body':         ['DMSans_400Regular',   'sans-serif'],
        'body-light':   ['DMSans_300Light',     'sans-serif'],
        'body-md':      ['DMSans_500Medium',    'sans-serif'],
        'body-sb':      ['DMSans_600SemiBold',  'sans-serif'],
      },

      fontSize: {
        xs:   [16, { lineHeight: '20px' }],
        sm:   [18, { lineHeight: '24px' }],
        base: [20, { lineHeight: '28px' }],
        md:   [22, { lineHeight: '30px' }],
        lg:   [26, { lineHeight: '32px' }],
        xl:   [30, { lineHeight: '38px' }],
        '2xl':[36, { lineHeight: '44px' }],
        '3xl':[44, { lineHeight: '52px' }],
      },

      letterSpacing: {
        tight:   '-0.02em',
        normal:  '0em',
        wide:    '0.05em',
        wider:   '0.10em',
        widest:  '0.16em',
      },

      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
        xl: '28px',
      },
    },
  },
  plugins: [],
}
