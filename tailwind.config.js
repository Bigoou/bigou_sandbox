module.exports = {
  mode: 'jit',
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'], // remove unused styles in production
  darkMode: 'media', // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        'metrotime': ['Metro_Time']
      },
      spacing: {
        '20vw': '20vw',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
