import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, MessageSquare, Save } from 'lucide-react';

export default function NotificationPreferencesPanel({ 
  onSave,
  initialPreferences = {}
}) {
  const [prefs, setPrefs] = useState(initialPreferences);
  const [saving, setSaving] = useState(false);

  const channels = [
    { id: 'email', label: 'E-Mail', icon: Mail },
    { id: 'in_app', label: 'In-App', icon: Bell },
    { id: 'sms', label: 'SMS', icon: MessageSquare }
  ];

  const categories = [
    { id: 'invoices', label: 'Rechnungen' },
    { id: 'contracts', label: 'Verträge' },
    { id: 'payments', label: 'Zahlungen' },
    { id: 'system', label: 'System' }
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.(prefs);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Benachrichtigungen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Channels */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">Kanäle</p>
          <div className="space-y-2">
            {channels.map(channel => {
              const Icon = channel.icon;
              return (
                <div key={channel.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700">{channel.label}</span>
                  </div>
                  <Switch
                    checked={prefs[`channel_${channel.id}`] ?? true}
                    onCheckedChange={(checked) =>
                      setPrefs(p => ({ ...p, [`channel_${channel.id}`]: checked }))
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">Kategorien</p>
          <div className="space-y-2">
            {categories.map(category => (
              <div key={category.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                <span className="text-sm text-slate-700">{category.label}</span>
                <Switch
                  checked={prefs[`category_${category.id}`] ?? true}
                  onCheckedChange={(checked) =>
                    setPrefs(p => ({ ...p, [`category_${category.id}`]: checked }))
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Wird gespeichert...' : 'Speichern'}
        </Button>
      </CardContent>
    </Card>
  );
}