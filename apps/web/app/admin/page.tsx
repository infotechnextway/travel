import {
  Package, Users, DollarSign, Eye
} from 'lucide-react';

const stats = [
  { label: 'Total Bookings', value: '1,248', icon: Package, color: 'text-sand' },
  { label: 'Active Users', value: '3,642', icon: Users, color: 'text-emerald' },
  { label: 'Revenue', value: '₹12.4L', icon: DollarSign, color: 'text-saffron' },
  { label: 'Page Views', value: '89.2K', icon: Eye, color: 'text-rose' },
];

export default function AdminDashboardPage() {
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

      {/* Placeholder */}
      <div className="glass p-8 text-center">
        <p className="text-cloud/50">
          Admin dashboard content will appear here as modules are built.
        </p>
        <p className="text-cloud/30 text-sm mt-2">
          This is a frontend demo — no backend connection required.
        </p>
      </div>
    </div>
  );
}
