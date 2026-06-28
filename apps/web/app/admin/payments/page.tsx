const transactions = [
  { id: 'TXN-5001', customer: 'Rahul Sharma', vendor: 'Heritage Travels', amount: '₹24,500', commission: '₹2,450', payout: '₹22,050', status: 'Completed', date: '28 Jun 2026' },
  { id: 'TXN-5002', customer: 'Priya Patel', vendor: 'Backwaters Pvt Ltd', amount: '₹18,200', commission: '₹1,820', payout: '₹16,380', status: 'Completed', date: '28 Jun 2026' },
  { id: 'TXN-5003', customer: 'Amit Kumar', vendor: 'Desert Dreams', amount: '₹31,000', commission: '₹3,100', payout: '₹27,900', status: 'Pending', date: '27 Jun 2026' },
  { id: 'TXN-5004', customer: 'Sneha Gupta', vendor: 'Coastal Escapes', amount: '₹15,750', commission: '₹1,575', payout: '₹14,175', status: 'Refunded', date: '27 Jun 2026' },
];

const statusStyles: Record<string, string> = {
  Completed: 'bg-emerald/10 text-emerald border-emerald/20',
  Pending: 'bg-saffron/10 text-saffron border-saffron/20',
  Refunded: 'bg-rose/10 text-rose border-rose/20',
};

export default function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-cloud">Payments & Payouts</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-5">
          <p className="text-cloud/50 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-cloud mt-1">₹12.4L</p>
        </div>
        <div className="glass p-5">
          <p className="text-cloud/50 text-sm">Platform Commission</p>
          <p className="text-2xl font-bold text-cloud mt-1">₹1.24L</p>
        </div>
        <div className="glass p-5">
          <p className="text-cloud/50 text-sm">Vendor Payouts</p>
          <p className="text-2xl font-bold text-cloud mt-1">₹11.16L</p>
        </div>
      </div>
      <div className="glass overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-cloud/40 border-b border-white/5">
              <th className="text-left py-3 px-5 font-medium">Transaction ID</th>
              <th className="text-left py-3 px-5 font-medium">Customer</th>
              <th className="text-left py-3 px-5 font-medium">Vendor</th>
              <th className="text-left py-3 px-5 font-medium">Amount</th>
              <th className="text-left py-3 px-5 font-medium">Commission</th>
              <th className="text-left py-3 px-5 font-medium">Payout</th>
              <th className="text-left py-3 px-5 font-medium">Status</th>
              <th className="text-left py-3 px-5 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id} className="border-b border-white/5 last:border-0">
                <td className="py-3 px-5 text-cloud/70">{txn.id}</td>
                <td className="py-3 px-5 text-cloud">{txn.customer}</td>
                <td className="py-3 px-5 text-cloud/70">{txn.vendor}</td>
                <td className="py-3 px-5 text-cloud">{txn.amount}</td>
                <td className="py-3 px-5 text-cloud/70">{txn.commission}</td>
                <td className="py-3 px-5 text-cloud">{txn.payout}</td>
                <td className="py-3 px-5">
                  <span className={`px-2 py-0.5 rounded text-xs border ${statusStyles[txn.status]}`}>
                    {txn.status}
                  </span>
                </td>
                <td className="py-3 px-5 text-cloud/50">{txn.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
