import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'India Travel Marketplace',
  description: 'Discover India like never before. Luxury tours, adventures, hotels, and experiences across the subcontinent.',
  keywords: 'India travel, tours, hotels, adventures, booking, experiences',
  openGraph: {
    title: 'India Travel Marketplace',
    description: 'Discover India like never before',
    type: 'website'
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-midnight text-cloud antialiased selection:bg-sand selection:text-midnight">
        {children}
      </body>
    </html>
  )
}
