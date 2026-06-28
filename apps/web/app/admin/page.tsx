import {
  Package, Users, DollarSign, Eye, TrendingUp, ArrowUpRight
} from 'lucide-react';

const stats = [
  { label: 'Total Bookings', value: '1,248', change: '+12.5%', icon: Package, color: 'text-sand' },
  { label: 'Active Users', value: '3,642', change: '+8.2%', icon: Users, color: 'text-emerald' },
  { label: 'Revenue', value: '₹12.4L', change: '+23.1%', icon: DollarSign, color: 'text-saffron' },
  { label: 'Page Views', value: '89.2K', change: '+15.7%', icon: Eye, color: 'text-rose' },
];

const recentBookings = [
  { id: 'BK-1001', customer: 'Rahul Sharma', listing: 'Golden Triangle Tour', vendor: 'Heritage Travels', amount: '₹24,500', status: 'Confirmed', date: '28 Jun 2026' },
  { id: 'BK-1002', customer: 'Priya Patel', listing: 'Kerala Houseboat Stay', vendor: 'Backwaters Pvt Ltd', amount: '₹18,200', status: 'Pending', date: '28 Jun 2026' },
  { id: 'BK-1003', customer: 'Amit Kumar', listing: 'Rajasthan Desert Safari', vendor: 'Desert Dreams', amount: '₹31,000', status: 'Confirmed', date: '27 Jun 2026' },
  { id: 'BK-1004', customer: 'Sneha Gupta', listing: 'Goa Beach Resort', vendor: 'Coastal Escapes', amount: '₹15,750', status: 'Cancelled', date: '27 Jun 2026' },
  { id: 'BK-1005', customer: 'Vikram Singh', listing: 'Ladakh Bike Trip', vendor: 'Mountain Trails', amount: '₹42,000', status: 'Confirmed', date: '26 Jun 2026' },
];

const topListings = [
  { name: 'Golden Triangle Tour', bookings: 142, revenue: '₹34.8L', rating: 4.9 },
  { name: 'Kerala Backwaters', bookings: 98, revenue: '₹21.2L', rating: 4.8 },
  { name: 'Rajasthan Heritage', bookings: 87, revenue: '₹18.5L', rating: 4.7 },
  { name: 'Goa Beach Package', bookings: 76, revenue: '₹12.1L', rating: 4.6 },
];

const statusStyles: Record<string, string> = {
  Confirmed: 'bg-emerald/10 text-emerald border-emerald/20',
  Pending: 'bg-saffron/10 text-saffron border-saffron/20',
  Cancelled: 'bg-rose/10 text-rose border-rose/20',
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass p-5">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="flex items-center gap-1 text-xs text-emerald">
                {stat.change}
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-2xl font-bold text-cloud">{stat.value}</p>
            <p className="text-sm text-cloud/50 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts / Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-cloud">Recent Bookings</h2>
            <button className="text-sm text-sand hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cloud/40 border-b border-white/5">
                  <th className="text-left py-2 font-medium">Booking ID</th>
                  <th className="text-left py-2 font-medium">Customer</th>
                  <th className="text-left py-2 font-medium">Listing</th>
                  <th className="text-left py-2 font-medium">Amount</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-left py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 text-cloud/70">{booking.id}</td>
                    <td className="py-3 text-cloud">{booking.customer}</td>
                    <td className="py-3 text-cloud/70">{booking.listing}</td>
                    <td className="py-3 text-cloud">{booking.amount}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs border ${statusStyles[booking.status]}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3 text-cloud/50">{booking.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Listings */}
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-cloud">Top Listings</h2>
            <TrendingUp className="w-4 h-4 text-cloud/40" />
          </div>
          <div className="space-y-4">
            {topListings.map((listing, index) => (
              <div key={listing.name} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs text-cloud/60">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-cloud text-sm truncate">{listing.name}</p>
                  <p className="text-cloud/40 text-xs">{listing.bookings} bookings</p>
                </div>
                <div className="text-right">
                  <p className="text-cloud text-sm">{listing.revenue}</p>
                  <p className="text-emerald text-xs">★ {listing.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-5">
          <p className="text-cloud/50 text-sm">New Vendors</p>
          <p className="text-2xl font-bold text-cloud mt-1">24</p>
          <p className="text-emerald text-xs mt-1">+6 this week</p>
        </div>
        <div className="glass p-5">
          <p className="text-cloud/50 text-sm">Pending Reviews</p>
          <p className="text-2xl font-bold text-cloud mt-1">18</p>
          <p className="text-saffron text-xs mt-1">Requires attention</p>
        </div>
        <div className="glass p-5">
          <p className="text-cloud/50 text-sm">Support Tickets</p>
          <p className="text-2xl font-bold text-cloud mt-1">7</p>
          <p className="text-rose text-xs mt-1">2 high priority</p>
        </div>
      </div>
    </div>
  );
}
