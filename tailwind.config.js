/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Medical Core (Trust)
        medical: {
          bg: '#f8fafc',      // slate-50
          text: '#0f172a',    // slate-900
          primary: '#2563eb', // blue-600 (Pantone 2144 C approximation)
        },
        // Gamified Layer (Engagement)
        gamification: {
          accent: '#8b5cf6',   // violet-500
          success: '#34d399',  // emerald-400
          agent: '#fbbf24',    // amber-400
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Space Grotesk', 'monospace'],
      },
    },
  },
  plugins: [],
}
