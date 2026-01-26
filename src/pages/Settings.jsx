import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Building2, Mail, FileText } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="text-gray-600 mt-1">Konfigurieren Sie Ihre App-Einstellungen</p>
      </div>

      {/* Allgemein */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Allgemeine Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Firmenname</Label>
            <Input placeholder="Ihre Hausverwaltung GmbH" />
          </div>
          <div className="space-y-2">
            <Label>Standard-Absender Email</Label>
            <Input type="email" placeholder="verwaltung@beispiel.de" />
          </div>
        </CardContent>
      </Card>

      {/* Supabase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Supabase-Verbindung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">
              ✓ Verbunden mit gemeinsamer FinTuttO-Datenbank
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Zugriff auf Gebäude, Einheiten, Mieter und Zählerstände
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email-Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email-Signatur</Label>
            <Input placeholder="Mit freundlichen Grüßen..." />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="bg-blue-900">Einstellungen speichern</Button>
      </div>
    </div>
  );
}