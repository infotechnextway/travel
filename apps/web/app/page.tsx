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
      </div>
    </main>
  )
}
