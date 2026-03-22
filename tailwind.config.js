/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        noir: '#0A0A0F',
        'noir-2': '#12121A',
        'noir-3': '#1C1C28',
        'noir-4': '#252535',
        gold: '#F5C842',
        'gold-dim': '#C9A235',
        crimson: '#E63946',
        'crimson-dim': '#B52D38',
        jade: '#2EC4B6',
        'jade-dim': '#25A49A',
        lavender: '#9B72CF',
        smoke: '#8888AA',
      },
      animation: {
        'flip-in': 'flipIn 0.6s ease-out',
        'flip-out': 'flipOut 0.6s ease-in',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        flipIn: {
          '0%': { transform: 'rotateY(-90deg)', opacity: '0' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        },
        flipOut: {
          '0%': { transform: 'rotateY(0deg)', opacity: '1' },
          '100%': { transform: 'rotateY(90deg)', opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px currentColor' },
          '50%': { boxShadow: '0 0 20px currentColor, 0 0 40px currentColor' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        spy: {
          primary: '#F5C842',
          secondary: '#9B72CF',
          accent: '#2EC4B6',
          neutral: '#1C1C28',
          'base-100': '#0A0A0F',
          'base-200': '#12121A',
          'base-300': '#1C1C28',
          info: '#2EC4B6',
          success: '#2EC4B6',
          warning: '#F5C842',
          error: '#E63946',
        },
      },
    ],
  },
};
