import {
  Package, DollarSign, Star, ArrowUpRight, Calendar
} from 'lucide-react';

const stats = [
  { label: 'Total Bookings', value: '86', change: '+14%', icon: Package, color: 'text-saffron' },
  { label: 'Revenue', value: '₹2.8L', change: '+22%', icon: DollarSign, color: 'text-emerald' },
  { label: 'Avg Rating', value: '4.8', change: '+0.2', icon: Star, color: 'text-sand' },
  { label: 'Active Listings', value: '12', change: '+3', icon: Package, color: 'text-cloud' },
];

const myListings = [
  { name: 'Golden Triangle Tour', type: 'Tour', price: '₹24,500', bookings: 32, status: 'Active', rating: 4.9 },
  { name: 'Kerala Houseboat Stay', type: 'Hotel', price: '₹18,200', bookings: 24, status: 'Active', rating: 4.8 },
  { name: 'Rajasthan Desert Safari', type: 'Activity', price: '₹31,000', bookings: 18, status: 'Under Review', rating: 4.7 },
  { name: 'Goa Beach Resort', type: 'Hotel', price: '₹15,750', bookings: 12, status: 'Active', rating: 4.6 },
];

const recentBookings = [
  { id: 'BK-2041', customer: 'Rahul Sharma', listing: 'Golden Triangle Tour', date: '28 Jun 2026', amount: '₹24,500', status: 'Confirmed' },
  { id: 'BK-2040', customer: 'Priya Patel', listing: 'Kerala Houseboat Stay', date: '27 Jun 2026', amount: '₹18,200', status: 'Confirmed' },
  { id: 'BK-2039', customer: 'Amit Kumar', listing: 'Golden Triangle Tour', date: '26 Jun 2026', amount: '₹49,000', status: 'Pending' },
  { id: 'BK-2038', customer: 'Sneha Gupta', listing: 'Goa Beach Resort', date: '25 Jun 2026', amount: '₹15,750', status: 'Cancelled' },
];

const recentReviews = [
  { customer: 'Rahul Sharma', rating: 5, comment: 'Amazing experience, highly recommended!' },
  { customer: 'Priya Patel', rating: 4, comment: 'Great service but pickup was delayed.' },
  { customer: 'Amit Kumar', rating: 5, comment: 'Best tour guide we ever had.' },
];

const statusStyles: Record<string, string> = {
  Active: 'bg-emerald/10 text-emerald border-emerald/20',
  Pending: 'bg-saffron/10 text-saffron border-saffron/20',
  Confirmed: 'bg-emerald/10 text-emerald border-emerald/20',
  Cancelled: 'bg-rose/10 text-rose border-rose/20',
  'Under Review': 'bg-cloud/10 text-cloud border-cloud/20',
};

export default function VendorDashboardPage() {
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Listings */}
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-cloud">My Listings</h2>
            <button className="text-sm text-saffron hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {myListings.map((listing) => (
              <div key={listing.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-cloud text-sm font-medium">{listing.name}</p>
                  <p className="text-cloud/40 text-xs">{listing.type} • {listing.bookings} bookings</p>
                </div>
                <div className="text-right">
                  <p className="text-cloud text-sm">{listing.price}</p>
                  <span className={`px-2 py-0.5 rounded text-xs border ${statusStyles[listing.status]}`}>
                    {listing.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-cloud">Recent Bookings</h2>
            <Calendar className="w-4 h-4 text-cloud/40" />
          </div>
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-cloud text-sm font-medium">{booking.customer}</p>
                  <p className="text-cloud/40 text-xs">{booking.listing} • {booking.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-cloud text-sm">{booking.amount}</p>
                  <span className={`px-2 py-0.5 rounded text-xs border ${statusStyles[booking.status]}`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="glass p-5">
        <h2 className="text-lg font-semibold text-cloud mb-4">Recent Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentReviews.map((review) => (
            <div key={review.customer} className="p-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${i < review.rating ? 'text-saffron fill-saffron' : 'text-cloud/20'}`}
                  />
                ))}
              </div>
              <p className="text-cloud/70 text-sm">&ldquo;{review.comment}&rdquo;</p>
              <p className="text-cloud/40 text-xs mt-2">— {review.customer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
