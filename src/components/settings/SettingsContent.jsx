import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsContent({ activeSection }) {
  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <Card>
            <CardHeader><CardTitle>Profileinstellungen</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Vollständiger Name" />
              <Input placeholder="Email" type="email" />
              <Input placeholder="Telefon" />
              <Button className="bg-slate-900 hover:bg-slate-800">Speichern</Button>
            </CardContent>
          </Card>
        );
      case 'security':
        return (
          <Card>
            <CardHeader><CardTitle>Sicherheitseinstellungen</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">2-Faktor-Authentifizierung aktivieren für mehr Sicherheit</p>
              <Button className="bg-slate-900 hover:bg-slate-800">2FA aktivieren</Button>
            </CardContent>
          </Card>
        );
      case 'notifications':
        return (
          <Card>
            <CardHeader><CardTitle>Benachrichtigungseinstellungen</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Email-Benachrichtigungen für wichtige Ereignisse</p>
            </CardContent>
          </Card>
        );
      case 'appearance':
        return (
          <Card>
            <CardHeader><CardTitle>Erscheinungsbild</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Design und Sprache anpassen</p>
            </CardContent>
          </Card>
        );
      default:
        return <Card><CardContent className="pt-6">Sektion wird geladen...</CardContent></Card>;
    }
  };

  return renderSection();
}