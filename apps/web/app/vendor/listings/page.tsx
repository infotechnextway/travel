import { Star } from 'lucide-react';

const listings = [
  { id: 'VL-101', name: 'Golden Triangle Tour', type: 'Tour', price: '₹24,500', status: 'Active', bookings: 32, rating: 4.9 },
  { id: 'VL-102', name: 'Kerala Houseboat Stay', type: 'Hotel', price: '₹18,200', status: 'Active', bookings: 24, rating: 4.8 },
  { id: 'VL-103', name: 'Rajasthan Desert Safari', type: 'Activity', price: '₹31,000', status: 'Under Review', bookings: 0, rating: 0 },
  { id: 'VL-104', name: 'Goa Beach Resort', type: 'Hotel', price: '₹15,750', status: 'Active', bookings: 12, rating: 4.6 },
];

const statusStyles: Record<string, string> = {
  Active: 'bg-emerald/10 text-emerald border-emerald/20',
  'Under Review': 'bg-saffron/10 text-saffron border-saffron/20',
  Paused: 'bg-cloud/10 text-cloud border-cloud/20',
};

export default function VendorListingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cloud">My Listings</h2>
        <button className="px-4 py-2 rounded-lg bg-saffron text-midnight text-sm font-medium hover:bg-saffron/90 transition">
          Create Listing
        </button>
      </div>
      <div className="glass overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-cloud/40 border-b border-white/5">
              <th className="text-left py-3 px-5 font-medium">ID</th>
              <th className="text-left py-3 px-5 font-medium">Listing</th>
              <th className="text-left py-3 px-5 font-medium">Type</th>
              <th className="text-left py-3 px-5 font-medium">Price</th>
              <th className="text-left py-3 px-5 font-medium">Bookings</th>
              <th className="text-left py-3 px-5 font-medium">Rating</th>
              <th className="text-left py-3 px-5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b border-white/5 last:border-0">
                <td className="py-3 px-5 text-cloud/70">{listing.id}</td>
                <td className="py-3 px-5 text-cloud">{listing.name}</td>
                <td className="py-3 px-5 text-cloud/70">{listing.type}</td>
                <td className="py-3 px-5 text-cloud">{listing.price}</td>
                <td className="py-3 px-5 text-cloud/70">{listing.bookings}</td>
                <td className="py-3 px-5">
                  <span className="flex items-center gap-1 text-saffron">
                    <Star className="w-3 h-3 fill-saffron" />
                    {listing.rating || '—'}
                  </span>
                </td>
                <td className="py-3 px-5">
                  <span className={`px-2 py-0.5 rounded text-xs border ${statusStyles[listing.status]}`}>
                    {listing.status}
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
