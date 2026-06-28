import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#0F172A',
        sand: '#D4AF37',
        cloud: '#F8FAFC',
        saffron: '#FF9933'
      }
    }
  },
  plugins: []
}

export default config
