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
        serif:       ['PlayfairDisplay_400Regular',    'serif'],
        'serif-i':   ['PlayfairDisplay_400Regular_Italic', 'serif'],
        'serif-sb':  ['PlayfairDisplay_600SemiBold',   'serif'],
        'serif-bold':['PlayfairDisplay_700Bold',       'serif'],
        sans:        ['DMSans_400Regular',             'sans-serif'],
        'sans-light':['DMSans_300Light',               'sans-serif'],
        'sans-md':   ['DMSans_500Medium',              'sans-serif'],
        'sans-sb':   ['DMSans_600SemiBold',            'sans-serif'],
      },

      fontSize: {
        xs:   [11, { lineHeight: '14px' }],
        sm:   [13, { lineHeight: '18px' }],
        base: [15, { lineHeight: '22px' }],
        md:   [17, { lineHeight: '24px' }],
        lg:   [20, { lineHeight: '26px' }],
        xl:   [22, { lineHeight: '28px' }],
        '2xl':[28, { lineHeight: '34px' }],
        '3xl':[34, { lineHeight: '40px' }],
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
