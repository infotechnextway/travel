'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, LayoutDashboard, Users, Package, CreditCard, Settings,
  LogOut, MapPin, TrendingUp, DollarSign, Eye
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Package, label: 'Listings', href: '/admin/listings' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: CreditCard, label: 'Payments', href: '/admin/payments' },
  { icon: MapPin, label: 'Destinations', href: '/admin/destinations' },
  { icon: TrendingUp, label: 'Analytics', href: '/admin/analytics' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

const stats = [
  { label: 'Total Bookings', value: '—', icon: Package, color: 'text-sand' },
  { label: 'Active Users', value: '—', icon: Users, color: 'text-emerald' },
  { label: 'Revenue', value: '—', icon: DollarSign, color: 'text-saffron' },
  { label: 'Page Views', value: '—', icon: Eye, color: 'text-rose' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const userData = localStorage.getItem('admin_user');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    try {
      setUser(JSON.parse(userData || '{}'));
    } catch {
      setUser(null);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh');
    localStorage.removeItem('admin_user');
    router.push('/admin/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight">
        <div className="text-cloud/50">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sand/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-sand" />
            </div>
            <div>
              <p className="text-sm font-semibold text-cloud">Admin Panel</p>
              <p className="text-xs text-cloud/40">India Travel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-cloud/60 hover:text-cloud hover:bg-white/5 transition text-sm"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose/70 hover:text-rose hover:bg-rose/5 transition text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        <header className="border-b border-white/10 px-8 py-4">
          <h1 className="text-xl font-semibold text-cloud">Dashboard</h1>
          <p className="text-sm text-cloud/50 mt-0.5">
            Welcome back, {user.name || user.email || 'Admin'}
          </p>
        </header>

        <main className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
              Dashboard content will appear here as modules are built.
            </p>
            <p className="text-cloud/30 text-sm mt-2">
              Connect your API to see live data.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
