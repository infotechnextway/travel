const monthlyRevenue = [
  { month: 'Jan', revenue: 45000 },
  { month: 'Feb', revenue: 52000 },
  { month: 'Mar', revenue: 68000 },
  { month: 'Apr', revenue: 61000 },
  { month: 'May', revenue: 79000 },
  { month: 'Jun', revenue: 85000 },
];

const topListings = [
  { name: 'Golden Triangle Tour', bookings: 32, revenue: '₹7.84L' },
  { name: 'Kerala Houseboat Stay', bookings: 24, revenue: '₹4.37L' },
  { name: 'Rajasthan Desert Safari', bookings: 18, revenue: '₹5.58L' },
  { name: 'Goa Beach Resort', bookings: 12, revenue: '₹1.89L' },
];

export default function VendorAnalyticsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-cloud">Analytics</h2>

      {/* Revenue Chart */}
      <div className="glass p-5">
        <h3 className="text-cloud/70 text-sm mb-4">Monthly Revenue</h3>
        <div className="flex items-end gap-4 h-48">
          {monthlyRevenue.map((stat) => (
            <div key={stat.month} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-saffron/20 rounded-t hover:bg-saffron/30 transition"
                style={{ height: `${(stat.revenue / 100000) * 100}%` }}
              />
              <span className="text-cloud/50 text-xs">{stat.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Listings */}
      <div className="glass p-5">
        <h3 className="text-cloud/70 text-sm mb-4">Top Performing Listings</h3>
        <div className="space-y-3">
          {topListings.map((listing, index) => (
            <div key={listing.name} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-cloud/60">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-cloud text-sm">{listing.name}</p>
                <p className="text-cloud/40 text-xs">{listing.bookings} bookings</p>
              </div>
              <p className="text-cloud text-sm">{listing.revenue}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
