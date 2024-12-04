module.exports = {
  content: ['./views/**/*.ejs'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          'primary': '#0f172a',
          'secondary': '#1e293b',
          'accent': '#334155',
          'hover': '#475569',
          'text': {
            primary: '#f8fafc',
            secondary: '#cbd5e1',
            accent: '#60a5fa'
          },
          'border': '#334155',
          'input': '#1e293b',
          'button': '#3b82f6'
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')
  ]
}; 