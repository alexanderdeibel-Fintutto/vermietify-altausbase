import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, RefreshCw, Database } from 'lucide-react';

export default function TaxAdminPanel() {
  const [isRunning, setIsRunning] = useState({});

  const handleRunFunction = async (functionName) => {
    setIsRunning(prev => ({ ...prev, [functionName]: true }));
    try {
      const { data } = await base44.functions.invoke(functionName);
      console.log(`${functionName} completed:`, data);
      alert(`✅ ${functionName} erfolgreich abgeschlossen`);
    } catch (error) {
      console.error(`Error running ${functionName}:`, error);
      alert(`❌ Fehler: ${error.message}`);
    } finally {
      setIsRunning(prev => ({ ...prev, [functionName]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">⚙️ Steuersystem Admin Panel</h1>
        <p className="text-slate-500 mt-1">Verwaltung und Konfiguration des Steuersystems</p>
      </div>

      <Tabs defaultValue="maintenance">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="maintenance">Wartung</TabsTrigger>
          <TabsTrigger value="data">Daten</TabsTrigger>
          <TabsTrigger value="laws">Gesetze</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🔄 Regelmäßige Aufgaben</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-slate-50 rounded border flex justify-between items-center">
                <div>
                  <p className="font-semibold">Steuerfrist-Erinnerungen</p>
                  <p className="text-sm text-slate-600 mt-1">Versenden Sie automatische E-Mail-Erinnerungen</p>
                </div>
                <Button
                  onClick={() => handleRunFunction('sendTaxReminders')}
                  disabled={isRunning['sendTaxReminders']}
                  className="gap-2"
                >
                  {isRunning['sendTaxReminders'] ? '⏳' : <RefreshCw className="w-4 h-4" />}
                  {isRunning['sendTaxReminders'] ? 'Läuft...' : 'Ausführen'}
                </Button>
              </div>

              <div className="p-4 bg-slate-50 rounded border flex justify-between items-center">
                <div>
                  <p className="font-semibold">Gesetzes-Änderungen überwachen</p>
                  <p className="text-sm text-slate-600 mt-1">Prüfen Sie auf neue Steuergesetze</p>
                </div>
                <Button
                  onClick={() => handleRunFunction('monitorTaxLawChanges')}
                  disabled={isRunning['monitorTaxLawChanges']}
                  className="gap-2"
                >
                  {isRunning['monitorTaxLawChanges'] ? '⏳' : <RefreshCw className="w-4 h-4" />}
                  {isRunning['monitorTaxLawChanges'] ? 'Läuft...' : 'Ausführen'}
                </Button>
              </div>

              <div className="p-4 bg-slate-50 rounded border flex justify-between items-center">
                <div>
                  <p className="font-semibold">Daten-Optimierung</p>
                  <p className="text-sm text-slate-600 mt-1">Optimieren Sie Datenbank und Cache</p>
                </div>
                <Button variant="outline" className="gap-2">
                  <Database className="w-4 h-4" />
                  Ausführen
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📊 Dateninitialisierung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-blue-50 rounded border flex justify-between items-center">
                <div>
                  <p className="font-semibold">Steuerfristen seeden</p>
                  <p className="text-sm text-slate-600 mt-1">Erstellen Sie Steuerfrist-Datensätze</p>
                </div>
                <Button
                  onClick={() => handleRunFunction('seedTaxDeadlines')}
                  disabled={isRunning['seedTaxDeadlines']}
                  className="gap-2 bg-blue-600"
                >
                  {isRunning['seedTaxDeadlines'] ? '⏳' : <Database className="w-4 h-4" />}
                  {isRunning['seedTaxDeadlines'] ? 'Läuft...' : 'Seeden'}
                </Button>
              </div>

              <div className="p-4 bg-green-50 rounded border flex justify-between items-center">
                <div>
                  <p className="font-semibold">Canton-Konfigurationen</p>
                  <p className="text-sm text-slate-600 mt-1">Initialisieren Sie Schweizer Canton-Daten</p>
                </div>
                <Button
                  onClick={() => handleRunFunction('seedCantonConfigs')}
                  disabled={isRunning['seedCantonConfigs']}
                  className="gap-2 bg-green-600"
                >
                  {isRunning['seedCantonConfigs'] ? '⏳' : <Database className="w-4 h-4" />}
                  {isRunning['seedCantonConfigs'] ? 'Läuft...' : 'Seeden'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📈 Daten-Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-2 border-b">
                <span>Tax Deadlines</span>
                <Badge>Aktiviert</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border-b">
                <span>Canton Configs</span>
                <Badge>Aktiviert</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border-b">
                <span>Tax Law Updates</span>
                <Badge variant="outline">Leer</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laws Tab */}
        <TabsContent value="laws" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>⚖️ Gesetzes-Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-yellow-50 rounded border">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-1" />
                  <div>
                    <p className="font-semibold">Neue Gesetze hinzufügen</p>
                    <p className="text-sm text-slate-600 mt-1">Verwenden Sie TaxLawUpdate Entity um neue Gesetze zu erfassen</p>
                    <Button variant="outline" size="sm" className="mt-2">Dashboard öffnen</Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded border">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-semibold">Nutzer benachrichtigen</p>
                    <p className="text-sm text-slate-600 mt-1">Senden Sie automatische Benachrichtigungen über Gesetzesänderungen</p>
                    <Button variant="outline" size="sm" className="mt-2">Benachrichtigungen senden</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🔧 Systemeinstellungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 border-b">
                <p className="font-semibold text-sm">Standardsteuerjahr</p>
                <p className="text-sm text-slate-600 mt-1">{new Date().getFullYear()}</p>
              </div>
              <div className="p-3 border-b">
                <p className="font-semibold text-sm">DACH-Länder</p>
                <div className="flex gap-2 mt-2">
                  <Badge>DE</Badge>
                  <Badge>AT</Badge>
                  <Badge>CH</Badge>
                </div>
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm">Benachrichtigungen</p>
                <p className="text-sm text-slate-600 mt-1">✅ Aktiviert für alle Länder</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}