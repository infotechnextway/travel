const monthlyStats = [
  { month: 'Jan', bookings: 89, revenue: 8.5 },
  { month: 'Feb', bookings: 102, revenue: 9.2 },
  { month: 'Mar', bookings: 145, revenue: 13.1 },
  { month: 'Apr', bookings: 132, revenue: 12.4 },
  { month: 'May', bookings: 178, revenue: 16.8 },
  { month: 'Jun', bookings: 198, revenue: 18.5 },
];

const topChannels = [
  { name: 'Organic Search', users: '12,450', share: 42 },
  { name: 'Direct', users: '8,320', share: 28 },
  { name: 'Social Media', users: '5,180', share: 18 },
  { name: 'Referrals', users: '3,600', share: 12 },
];

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-cloud">Analytics</h2>

      {/* Simple Bar Chart */}
      <div className="glass p-5">
        <h3 className="text-cloud/70 text-sm mb-4">Monthly Bookings</h3>
        <div className="flex items-end gap-4 h-48">
          {monthlyStats.map((stat) => (
            <div key={stat.month} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-sand/20 rounded-t hover:bg-sand/30 transition"
                style={{ height: `${(stat.bookings / 200) * 100}%` }}
              />
              <span className="text-cloud/50 text-xs">{stat.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Traffic Channels */}
      <div className="glass p-5">
        <h3 className="text-cloud/70 text-sm mb-4">Traffic Channels</h3>
        <div className="space-y-4">
          {topChannels.map((channel) => (
            <div key={channel.name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-cloud">{channel.name}</span>
                <span className="text-cloud/50">{channel.users} users</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-sand rounded-full"
                  style={{ width: `${channel.share}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
