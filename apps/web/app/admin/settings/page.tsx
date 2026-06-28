const settings = [
  { label: 'Platform Commission', value: '10%', description: 'Default commission on every booking' },
  { label: 'Currency', value: 'INR (₹)', description: 'Primary currency for transactions' },
  { label: 'Booking Cutoff', value: '24 hours', description: 'Minimum advance booking time' },
  { label: 'Auto-approve Vendors', value: 'Off', description: 'Require manual review for new vendors' },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-cloud">Settings</h2>
      <div className="glass p-5 max-w-2xl">
        <div className="space-y-4">
          {settings.map((setting) => (
            <div key={setting.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div>
                <p className="text-cloud text-sm font-medium">{setting.label}</p>
                <p className="text-cloud/40 text-xs">{setting.description}</p>
              </div>
              <span className="text-cloud/70 text-sm">{setting.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
