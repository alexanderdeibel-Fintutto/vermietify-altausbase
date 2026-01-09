import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function TenantPortalWelcome({ tenant }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Nachmittag';
    return 'Guten Abend';
  };

  return (
    <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 mb-8">
      <CardContent className="pt-6">
        <h2 className="text-2xl font-bold mb-2">{getGreeting()}, {tenant.name.split(' ')[0]}! 👋</h2>
        <p className="text-blue-100 mb-4">
          Willkommen in deinem persönlichen Mieterportal. Hier kannst du alle wichtigen Informationen einsehen und mit deinem Verwaltungsteam kommunizieren.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="flex items-start gap-2 bg-blue-500 bg-opacity-50 p-3 rounded">
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">Vertragsinfos</p>
              <p className="text-xs text-blue-100">Jederzeit verfügbar</p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-blue-500 bg-opacity-50 p-3 rounded">
            <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">24/7 Support</p>
              <p className="text-xs text-blue-100">Immer erreichbar</p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-blue-500 bg-opacity-50 p-3 rounded">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">Schnelle Anfragen</p>
              <p className="text-xs text-blue-100">In wenigen Klicks</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}