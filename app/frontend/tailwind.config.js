/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAF7',
        surface: '#FFFFFF',
        line: '#E5E7E0',
        ink: '#1C2420',
        muted: '#5F6B64',
        brand: '#1F6B4A',
        'brand-dark': '#17513A',
        'brand-soft': '#E4F1EA',
        'wet-soft': '#E4F1EA',
        wet: '#17513A',
        'dry-soft': '#E3EEF9',
        dry: '#1D4E89',
        'sanitary-soft': '#FDF1D8',
        sanitary: '#8A5A00',
        'special-soft': '#FBE4E1',
        special: '#9B2C1F',
        'ewaste-soft': '#EDE6F8',
        ewaste: '#5B3A9E',
        'demo-soft': '#FFF8E6',
        demo: '#8A5A00',
        'demo-line': '#B7791F',
        'status-soft': '#E8EAE6',
        status: '#44504A',
        danger: '#B3261E',
      },
      fontFamily: {
        display: ['Manrope Variable', 'Manrope', 'sans-serif'],
        body: ['Inter Variable', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 28px rgba(28, 36, 32, 0.035)',
        raised: '0 24px 70px rgba(28, 36, 32, 0.17)',
      },
    },
  },
  plugins: [],
}
