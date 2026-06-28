import {
  Package, DollarSign, Star
} from 'lucide-react';

const stats = [
  { label: 'Total Bookings', value: '86', icon: Package, color: 'text-saffron' },
  { label: 'Revenue', value: '₹2.8L', icon: DollarSign, color: 'text-emerald' },
  { label: 'Avg Rating', value: '4.8', icon: Star, color: 'text-sand' },
  { label: 'Active Listings', value: '12', icon: Package, color: 'text-cloud' },
];

export default function VendorDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass p-5">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-cloud">{stat.value}</p>
            <p className="text-sm text-cloud/50 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass p-6 hover:border-saffron/30 transition group cursor-pointer">
          <h3 className="text-cloud font-semibold group-hover:text-saffron transition">Create New Listing</h3>
          <p className="text-cloud/50 text-sm mt-1">Add a tour, hotel, activity, or transport listing</p>
        </div>
        <div className="glass p-6 hover:border-saffron/30 transition group cursor-pointer">
          <h3 className="text-cloud font-semibold group-hover:text-saffron transition">Manage Bookings</h3>
          <p className="text-cloud/50 text-sm mt-1">View and manage incoming customer bookings</p>
        </div>
      </div>

      {/* Placeholder */}
      <div className="glass p-8 text-center">
        <p className="text-cloud/50">
          Vendor dashboard content will appear here as modules are built.
        </p>
        <p className="text-cloud/30 text-sm mt-2">
          This is a frontend demo — no backend connection required.
        </p>
      </div>
    </div>
  );
}
