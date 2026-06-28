import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vendor Dashboard | India Travel Marketplace',
  description: 'Manage your listings, bookings, and payouts'
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-midnight text-cloud">
      {children}
    </div>
  )
}
