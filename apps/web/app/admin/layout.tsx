import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard | India Travel Marketplace',
  description: 'Platform administration and operations'
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-midnight text-cloud">
      {children}
    </div>
  )
}
