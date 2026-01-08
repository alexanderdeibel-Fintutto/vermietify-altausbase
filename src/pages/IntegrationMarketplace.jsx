import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plug, Star, Users } from 'lucide-react';

export default function IntegrationMarketplacePage() {
  const integrations = [
    { name: 'Google Drive', category: 'Cloud Storage', rating: 4.8, users: 245, connected: true, description: 'Synchronisieren Sie Dokumente mit Google Drive' },
    { name: 'Slack', category: 'Communication', rating: 4.9, users: 189, connected: false, description: 'Benachrichtigungen an Slack-Kanäle senden' },
    { name: 'Zapier', category: 'Automation', rating: 4.7, users: 156, connected: false, description: 'Verbindung zu 5000+ Apps über Zapier' },
    { name: 'DATEV', category: 'Accounting', rating: 4.6, users: 234, connected: false, description: 'Direkter Export zu DATEV-Buchhaltung' },
    { name: 'Stripe', category: 'Payments', rating: 4.8, users: 120, connected: false, description: 'Online-Zahlungen akzeptieren' },
    { name: 'Dropbox', category: 'Cloud Storage', rating: 4.5, users: 87, connected: false, description: 'Dateien in Dropbox speichern' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🔌 Integration Marketplace</h1>
        <p className="text-slate-600 mt-1">Verbinden Sie mit Ihren Lieblings-Apps</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {integrations.map((int, idx) => (
          <Card key={idx} className={`border ${int.connected ? 'border-green-300 bg-green-50' : 'border-slate-200'}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Plug className="w-5 h-5" /> {int.name}
                  </h3>
                  <Badge variant="outline" className="mt-1 text-xs">{int.category}</Badge>
                </div>
                {int.connected && <Badge className="bg-green-600">Verbunden</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">{int.description}</p>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" /> {int.rating}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {int.users}</span>
              </div>
              {int.connected ? (
                <Button variant="outline" className="w-full">Einstellungen</Button>
              ) : (
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Verbinden</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}