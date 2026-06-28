const payouts = [
  { id: 'PY-301', period: '1-15 Jun 2026', bookings: 12, revenue: '₹1,42,000', commission: '₹14,200', net: '₹1,27,800', status: 'Paid' },
  { id: 'PY-302', period: '16-30 May 2026', bookings: 9, revenue: '₹98,500', commission: '₹9,850', net: '₹88,650', status: 'Paid' },
  { id: 'PY-303', period: '1-15 May 2026', bookings: 11, revenue: '₹1,18,000', commission: '₹11,800', net: '₹1,06,200', status: 'Paid' },
  { id: 'PY-304', period: '16-30 Apr 2026', bookings: 7, revenue: '₹76,000', commission: '₹7,600', net: '₹68,400', status: 'Pending' },
];

const statusStyles: Record<string, string> = {
  Paid: 'bg-emerald/10 text-emerald border-emerald/20',
  Pending: 'bg-saffron/10 text-saffron border-saffron/20',
};

export default function VendorPayoutsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-cloud">Payouts</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-5">
          <p className="text-cloud/50 text-sm">Total Earnings</p>
          <p className="text-2xl font-bold text-cloud mt-1">₹2.8L</p>
        </div>
        <div className="glass p-5">
          <p className="text-cloud/50 text-sm">This Month</p>
          <p className="text-2xl font-bold text-cloud mt-1">₹1,27,800</p>
        </div>
        <div className="glass p-5">
          <p className="text-cloud/50 text-sm">Pending</p>
          <p className="text-2xl font-bold text-cloud mt-1">₹68,400</p>
        </div>
      </div>
      <div className="glass overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-cloud/40 border-b border-white/5">
              <th className="text-left py-3 px-5 font-medium">Payout ID</th>
              <th className="text-left py-3 px-5 font-medium">Period</th>
              <th className="text-left py-3 px-5 font-medium">Bookings</th>
              <th className="text-left py-3 px-5 font-medium">Revenue</th>
              <th className="text-left py-3 px-5 font-medium">Commission</th>
              <th className="text-left py-3 px-5 font-medium">Net Payout</th>
              <th className="text-left py-3 px-5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.id} className="border-b border-white/5 last:border-0">
                <td className="py-3 px-5 text-cloud/70">{payout.id}</td>
                <td className="py-3 px-5 text-cloud">{payout.period}</td>
                <td className="py-3 px-5 text-cloud/70">{payout.bookings}</td>
                <td className="py-3 px-5 text-cloud">{payout.revenue}</td>
                <td className="py-3 px-5 text-cloud/70">{payout.commission}</td>
                <td className="py-3 px-5 text-cloud">{payout.net}</td>
                <td className="py-3 px-5">
                  <span className={`px-2 py-0.5 rounded text-xs border ${statusStyles[payout.status]}`}>
                    {payout.status}
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
