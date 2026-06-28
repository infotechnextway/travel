'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Store, LayoutDashboard, Package, Calendar, CreditCard,
  LogOut, Star, Users, TrendingUp, Settings
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/vendor' },
  { icon: Package, label: 'My Listings', href: '/vendor/listings' },
  { icon: Calendar, label: 'Bookings', href: '/vendor/bookings' },
  { icon: CreditCard, label: 'Payouts', href: '/vendor/payouts' },
  { icon: Star, label: 'Reviews', href: '/vendor/reviews' },
  { icon: Users, label: 'Customers', href: '/vendor/customers' },
  { icon: TrendingUp, label: 'Analytics', href: '/vendor/analytics' },
  { icon: Settings, label: 'Settings', href: '/vendor/settings' },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-midnight flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-saffron/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-saffron" />
            </div>
            <div>
              <p className="text-sm font-semibold text-cloud">Vendor Panel</p>
              <p className="text-xs text-cloud/40">India Travel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                  isActive
                    ? 'text-cloud bg-white/10'
                    : 'text-cloud/60 hover:text-cloud hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            href="/"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-cloud/60 hover:text-cloud hover:bg-white/5 transition text-sm"
          >
            <LogOut className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="border-b border-white/10 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-cloud">Vendor Dashboard</h1>
            <p className="text-sm text-cloud/50 mt-0.5">Welcome back, Demo Vendor</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-saffron/10 text-saffron text-xs border border-saffron/20">
            Demo Mode
          </div>
        </header>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}