const customers = [
  { id: 'C-101', name: 'Rahul Sharma', email: 'rahul@example.com', bookings: 3, totalSpent: '₹68,500', lastBooking: '28 Jun 2026' },
  { id: 'C-102', name: 'Priya Patel', email: 'priya@example.com', bookings: 2, totalSpent: '₹42,200', lastBooking: '27 Jun 2026' },
  { id: 'C-103', name: 'Amit Kumar', email: 'amit@example.com', bookings: 4, totalSpent: '₹95,000', lastBooking: '26 Jun 2026' },
  { id: 'C-104', name: 'Sneha Gupta', email: 'sneha@example.com', bookings: 1, totalSpent: '₹15,750', lastBooking: '25 Jun 2026' },
];

export default function VendorCustomersPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-cloud">Customers</h2>
      <div className="glass overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-cloud/40 border-b border-white/5">
              <th className="text-left py-3 px-5 font-medium">Customer ID</th>
              <th className="text-left py-3 px-5 font-medium">Name</th>
              <th className="text-left py-3 px-5 font-medium">Email</th>
              <th className="text-left py-3 px-5 font-medium">Bookings</th>
              <th className="text-left py-3 px-5 font-medium">Total Spent</th>
              <th className="text-left py-3 px-5 font-medium">Last Booking</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-white/5 last:border-0">
                <td className="py-3 px-5 text-cloud/70">{customer.id}</td>
                <td className="py-3 px-5 text-cloud">{customer.name}</td>
                <td className="py-3 px-5 text-cloud/70">{customer.email}</td>
                <td className="py-3 px-5 text-cloud/70">{customer.bookings}</td>
                <td className="py-3 px-5 text-cloud">{customer.totalSpent}</td>
                <td className="py-3 px-5 text-cloud/50">{customer.lastBooking}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
