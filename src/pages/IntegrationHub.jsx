import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckCircle, AlertCircle, Settings } from 'lucide-react';

export default function IntegrationHubPage() {
  const integrations = [
    { name: 'ELSTER', status: 'connected', category: 'Steuern', description: 'Steuerformulare einreichen' },
    { name: 'FinAPI', status: 'connected', category: 'Banking', description: 'Banktransaktionen synchronisieren' },
    { name: 'Google Drive', status: 'pending', category: 'Speicher', description: 'Dokumente speichern' },
    { name: 'Stripe', status: 'disconnected', category: 'Zahlungen', description: 'Zahlungsabwicklung' },
    { name: 'Slack', status: 'connected', category: 'Kommunikation', description: 'Benachrichtigungen' },
    { name: 'WhatsApp', status: 'connected', category: 'Kommunikation', description: 'Nachrichten versenden' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🔌 Integration Hub</h1>
        <p className="text-slate-600 mt-1">Verwalten Sie externe Service-Integrationen</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border border-slate-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-600">{integrations.filter(i => i.status === 'connected').length}</p>
            <p className="text-sm text-slate-600">Verbunden</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-orange-50">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-orange-600">{integrations.filter(i => i.status === 'pending').length}</p>
            <p className="text-sm text-slate-600">Ausstehend</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-red-600">{integrations.filter(i => i.status === 'disconnected').length}</p>
            <p className="text-sm text-slate-600">Nicht verbunden</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {integrations.map((integration, idx) => (
          <Card key={idx} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Zap className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">{integration.name}</h3>
                    <Badge className={
                      integration.status === 'connected' ? 'bg-green-600' :
                      integration.status === 'pending' ? 'bg-orange-600' :
                      'bg-slate-600'
                    }>
                      {integration.status === 'connected' ? '✓ Verbunden' :
                       integration.status === 'pending' ? 'Ausstehend' :
                       'Getrennt'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{integration.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline"><Settings className="w-4 h-4" /></Button>
                  {integration.status !== 'connected' && (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Verbinden</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}