const users = [
  { id: 'U-1001', name: 'Rahul Sharma', email: 'rahul@example.com', role: 'Customer', bookings: 5, joined: '15 Jan 2026' },
  { id: 'U-1002', name: 'Priya Patel', email: 'priya@example.com', role: 'Customer', bookings: 3, joined: '22 Feb 2026' },
  { id: 'U-1003', name: 'Amit Kumar', email: 'amit@example.com', role: 'Vendor', bookings: 0, joined: '10 Mar 2026' },
  { id: 'U-1004', name: 'Sneha Gupta', email: 'sneha@example.com', role: 'Guide', bookings: 0, joined: '05 Apr 2026' },
  { id: 'U-1005', name: 'Vikram Singh', email: 'vikram@example.com', role: 'Admin', bookings: 0, joined: '01 Jan 2026' },
];

const roleStyles: Record<string, string> = {
  Customer: 'bg-emerald/10 text-emerald border-emerald/20',
  Vendor: 'bg-saffron/10 text-saffron border-saffron/20',
  Guide: 'bg-cloud/10 text-cloud border-cloud/20',
  Admin: 'bg-rose/10 text-rose border-rose/20',
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cloud">User Management</h2>
        <button className="px-4 py-2 rounded-lg bg-sand text-midnight text-sm font-medium hover:bg-sand/90 transition">
          Add User
        </button>
      </div>
      <div className="glass overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-cloud/40 border-b border-white/5">
              <th className="text-left py-3 px-5 font-medium">ID</th>
              <th className="text-left py-3 px-5 font-medium">Name</th>
              <th className="text-left py-3 px-5 font-medium">Email</th>
              <th className="text-left py-3 px-5 font-medium">Role</th>
              <th className="text-left py-3 px-5 font-medium">Bookings</th>
              <th className="text-left py-3 px-5 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-white/5 last:border-0">
                <td className="py-3 px-5 text-cloud/70">{user.id}</td>
                <td className="py-3 px-5 text-cloud">{user.name}</td>
                <td className="py-3 px-5 text-cloud/70">{user.email}</td>
                <td className="py-3 px-5">
                  <span className={`px-2 py-0.5 rounded text-xs border ${roleStyles[user.role]}`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-5 text-cloud/70">{user.bookings}</td>
                <td className="py-3 px-5 text-cloud/50">{user.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
