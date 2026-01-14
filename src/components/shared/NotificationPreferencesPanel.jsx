import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';

const notificationTypes = [
  { 
    id: 'email', 
    icon: Mail, 
    label: 'E-Mail',
    description: 'Erhalten Sie E-Mail-Benachrichtigungen'
  },
  { 
    id: 'push', 
    icon: Smartphone, 
    label: 'Push-Benachrichtigungen',
    description: 'Browser-Benachrichtigungen'
  },
  { 
    id: 'sms', 
    icon: MessageSquare, 
    label: 'SMS',
    description: 'Wichtige Updates per SMS'
  },
  { 
    id: 'inApp', 
    icon: Bell, 
    label: 'In-App',
    description: 'Benachrichtigungen in der App'
  }
];

const categories = [
  { id: 'contracts', label: 'Verträge', description: 'Neue Verträge, Ablauf, Änderungen' },
  { id: 'payments', label: 'Zahlungen', description: 'Zahlungserinnerungen, Eingänge' },
  { id: 'maintenance', label: 'Wartungen', description: 'Wartungsaufträge und Updates' },
  { id: 'documents', label: 'Dokumente', description: 'Neue Dokumente, Genehmigungen' }
];

export default function NotificationPreferencesPanel({ 
  preferences = {},
  onSave 
}) {
  const [settings, setSettings] = useState(preferences);

  const toggleChannel = (category, channel) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category]?.[channel]
      }
    }));
  };

  const handleSave = () => {
    onSave?.(settings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Benachrichtigungseinstellungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map((category) => (
          <div key={category.id} className="space-y-3">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="font-medium text-slate-900">{category.label}</h4>
              <p className="text-xs text-slate-500">{category.description}</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {notificationTypes.map((type) => {
                const Icon = type.icon;
                const isEnabled = settings[category.id]?.[type.id] || false;
                
                return (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Switch
                      id={`${category.id}-${type.id}`}
                      checked={isEnabled}
                      onCheckedChange={() => toggleChannel(category.id, type.id)}
                    />
                    <Label 
                      htmlFor={`${category.id}-${type.id}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-slate-600" />
                      <span className="text-sm">{type.label}</span>
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <Button onClick={handleSave} className="w-full">
          Einstellungen speichern
        </Button>
      </CardContent>
    </Card>
  );
}