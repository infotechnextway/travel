import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sand/10 via-midnight to-midnight" />
      <div className="relative z-10 text-center space-y-6">
        <h1 className="text-5xl md:text-7xl font-display text-sand tracking-tight">
          India Travel Marketplace
        </h1>
        <p className="text-xl text-cloud/70 max-w-2xl mx-auto">
          Premium travel experiences across the subcontinent
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link
            href="/admin/login"
            className="px-6 py-2.5 rounded-lg border border-sand/30 text-sand hover:bg-sand/10 transition text-sm"
          >
            Admin Login
          </Link>
          <Link
            href="/vendor/login"
            className="px-6 py-2.5 rounded-lg bg-saffron text-midnight font-semibold hover:bg-saffron/90 transition text-sm"
          >
            Vendor Login
          </Link>
        </div>
      </div>
    </main>
  )
}
