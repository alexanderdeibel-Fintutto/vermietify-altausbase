import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, MessageCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function WhatsAppSettingsPage() {
  const [connected, setConnected] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">💬 WhatsApp Settings</h1>
        <p className="text-slate-600 mt-1">Konfigurieren Sie WhatsApp Integration für automatische Benachrichtigungen</p>
      </div>

      {!connected ? (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            WhatsApp ist nicht verbunden. Folgen Sie den Schritten unten zur Konfiguration.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            WhatsApp ist erfolgreich verbunden und einsatzbereit.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageCircle className="w-5 h-5" /> Account-Verbindung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Telefonnummer</label>
              <Input placeholder="+49 30 123456" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Access Token</label>
              <Input type="password" placeholder="••••••••••••••••••••" />
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              {connected ? 'Neu verbinden' : 'Verbinden'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Message Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {['Zahlungserinnerung', 'Mietvertrag Info', 'Wartungsmitteilung'].map((template, idx) => (
              <div key={idx} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">{template}</span>
                <Badge variant="outline">Genehmigt</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Broadcast Lists</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[{ name: 'Mieter aktiv', count: 145 }, { name: 'Vermieter', count: 23 }].map((list, idx) => (
              <div key={idx} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{list.name}</p>
                  <p className="text-xs text-slate-600">{list.count} Kontakte</p>
                </div>
                <Button size="sm" variant="outline">Bearbeiten</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}