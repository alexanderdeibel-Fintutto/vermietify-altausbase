import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Wrench, Droplet, Zap, Flame } from 'lucide-react';

export default function EmergencyContacts() {
  const contacts = [
    { name: 'Sanitär-Notdienst', phone: '+49 123 456789', icon: Droplet, color: 'text-blue-600' },
    { name: 'Elektriker 24h', phone: '+49 123 456790', icon: Zap, color: 'text-yellow-600' },
    { name: 'Heizung-Service', phone: '+49 123 456791', icon: Flame, color: 'text-orange-600' },
    { name: 'Allround-Handwerker', phone: '+49 123 456792', icon: Wrench, color: 'text-slate-600' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Phone className="w-4 h-4" />
          Notfallkontakte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {contacts.map((contact, idx) => (
          <a key={idx} href={`tel:${contact.phone}`}>
            <Button variant="outline" className="w-full justify-start h-auto py-3">
              <contact.icon className={`w-4 h-4 mr-3 ${contact.color}`} />
              <div className="text-left flex-1">
                <p className="font-semibold text-sm">{contact.name}</p>
                <p className="text-xs text-slate-600">{contact.phone}</p>
              </div>
            </Button>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}