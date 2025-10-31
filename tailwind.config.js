/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0f14',
        panel: '#121822',
        muted: '#93a1b1',
        text: '#e6edf3',
        border: '#223045',
        accent: '#10b981',
      },
    },
  },
  plugins: [],
};
