import { MapPin } from 'lucide-react';

const destinations = [
  { id: 'D-101', name: 'Jaipur, Rajasthan', listings: 42, bookings: 312, rating: 4.8, trending: true },
  { id: 'D-102', name: 'Kochi, Kerala', listings: 38, bookings: 278, rating: 4.7, trending: true },
  { id: 'D-103', name: 'Goa', listings: 56, bookings: 421, rating: 4.6, trending: false },
  { id: 'D-104', name: 'Leh Ladakh', listings: 24, bookings: 156, rating: 4.9, trending: true },
  { id: 'D-105', name: 'Varanasi, UP', listings: 31, bookings: 189, rating: 4.5, trending: false },
];

export default function AdminDestinationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cloud">Destinations</h2>
        <button className="px-4 py-2 rounded-lg bg-sand text-midnight text-sm font-medium hover:bg-sand/90 transition">
          Add Destination
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {destinations.map((dest) => (
          <div key={dest.id} className="glass p-5 hover:border-sand/20 transition">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-sand/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-sand" />
              </div>
              {dest.trending && (
                <span className="px-2 py-0.5 rounded text-xs bg-emerald/10 text-emerald border border-emerald/20">
                  Trending
                </span>
              )}
            </div>
            <h3 className="text-cloud font-semibold">{dest.name}</h3>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="text-cloud/50">{dest.listings} listings</span>
              <span className="text-cloud/50">{dest.bookings} bookings</span>
            </div>
            <p className="text-saffron text-sm mt-2">★ {dest.rating}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
