const bookings = [
  { id: 'BK-2041', customer: 'Rahul Sharma', listing: 'Golden Triangle Tour', date: '28 Jun 2026', travelers: 4, amount: '₹24,500', status: 'Confirmed' },
  { id: 'BK-2040', customer: 'Priya Patel', listing: 'Kerala Houseboat Stay', date: '27 Jun 2026', travelers: 2, amount: '₹18,200', status: 'Confirmed' },
  { id: 'BK-2039', customer: 'Amit Kumar', listing: 'Golden Triangle Tour', date: '26 Jun 2026', travelers: 6, amount: '₹49,000', status: 'Pending' },
  { id: 'BK-2038', customer: 'Sneha Gupta', listing: 'Goa Beach Resort', date: '25 Jun 2026', travelers: 3, amount: '₹15,750', status: 'Cancelled' },
  { id: 'BK-2037', customer: 'Vikram Singh', listing: 'Rajasthan Desert Safari', date: '24 Jun 2026', travelers: 5, amount: '₹31,000', status: 'Confirmed' },
];

const statusStyles: Record<string, string> = {
  Confirmed: 'bg-emerald/10 text-emerald border-emerald/20',
  Pending: 'bg-saffron/10 text-saffron border-saffron/20',
  Cancelled: 'bg-rose/10 text-rose border-rose/20',
};

export default function VendorBookingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-cloud">Bookings</h2>
      <div className="glass overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-cloud/40 border-b border-white/5">
              <th className="text-left py-3 px-5 font-medium">Booking ID</th>
              <th className="text-left py-3 px-5 font-medium">Customer</th>
              <th className="text-left py-3 px-5 font-medium">Listing</th>
              <th className="text-left py-3 px-5 font-medium">Date</th>
              <th className="text-left py-3 px-5 font-medium">Travelers</th>
              <th className="text-left py-3 px-5 font-medium">Amount</th>
              <th className="text-left py-3 px-5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b border-white/5 last:border-0">
                <td className="py-3 px-5 text-cloud/70">{booking.id}</td>
                <td className="py-3 px-5 text-cloud">{booking.customer}</td>
                <td className="py-3 px-5 text-cloud/70">{booking.listing}</td>
                <td className="py-3 px-5 text-cloud/70">{booking.date}</td>
                <td className="py-3 px-5 text-cloud/70">{booking.travelers}</td>
                <td className="py-3 px-5 text-cloud">{booking.amount}</td>
                <td className="py-3 px-5">
                  <span className={`px-2 py-0.5 rounded text-xs border ${statusStyles[booking.status]}`}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
