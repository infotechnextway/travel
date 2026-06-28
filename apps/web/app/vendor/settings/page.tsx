const settings = [
  { label: 'Business Name', value: 'Heritage Travels Pvt Ltd', description: 'Registered business name' },
  { label: 'GST Number', value: '27AABCU9603R1ZX', description: 'Tax registration number' },
  { label: 'Payout Method', value: 'Bank Transfer', description: 'How you receive payouts' },
  { label: 'Commission Rate', value: '10%', description: 'Platform fee on each booking' },
];

export default function VendorSettingsPage() {
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
