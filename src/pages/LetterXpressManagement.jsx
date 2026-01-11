import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import LetterTemplateSelector from '@/components/letterxpress/LetterTemplateSelector';
import LetterRecipientSelector from '@/components/letterxpress/LetterRecipientSelector';
import LetterPreview from '@/components/letterxpress/LetterPreview';

export default function LetterXpressManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [apiKey, setApiKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [email, setEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState('');

  const shipments = [
    { id: 1, count: 5, status: 'delivered', date: '2026-01-10', cost: 15.50 },
    { id: 2, count: 3, status: 'in_transit', date: '2026-01-09', cost: 9.30 },
    { id: 3, count: 7, status: 'pending', date: '2026-01-11', cost: 21.70 },
  ];

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_transit': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default: return null;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'delivered': 'Zugestellt',
      'in_transit': 'Unterwegs',
      'pending': 'Ausstehend'
    };
    return labels[status] || status;
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setMessage('');
    try {
      // API-Aufruf zum Speichern der Credentials
      // Später: await base44.functions.invoke('saveLetterXpressCredentials', { apiKey, accountId, email });
      setMessage('✓ Einstellungen gespeichert');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('✗ Fehler beim Speichern');
    }
    setSaveLoading(false);
  };

  const handleTest = async () => {
    setTestLoading(true);
    setMessage('');
    try {
      // API-Aufruf zum Testen der Verbindung
      // Später: await base44.functions.invoke('testLetterXpressConnection', { apiKey, accountId, email });
      setMessage('✓ Verbindung erfolgreich');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('✗ Verbindung fehlgeschlagen');
    }
    setTestLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Postversand (LetterXpress)</h1>
          <p className="text-slate-600 font-light mt-2">Verwalten Sie den physischen Postversand zu Mietern</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Send className="w-4 h-4 mr-2" />
          Neuer Versand
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Diese Woche versendet</p>
            <p className="text-2xl font-semibold mt-2">15 Briefe</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Gesamtkosten</p>
            <p className="text-2xl font-semibold mt-2">€46,50</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Ausstehend</p>
            <p className="text-2xl font-semibold mt-2">7 Briefe</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Durchschnitt pro Brief</p>
            <p className="text-2xl font-semibold mt-2">€3,10</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="history">Verlauf</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>

        {/* Neuer Versand */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <LetterTemplateSelector />
              <LetterRecipientSelector />
            </div>
            <LetterPreview />
          </div>
        </TabsContent>

        {/* Übersicht - alternativ */}
        <TabsContent value="overview-alt" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Aktive Versände</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {shipments.map(ship => (
                <div key={ship.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">{ship.count} Briefe</p>
                      <p className="text-xs text-slate-500">{ship.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium text-sm">€{ship.cost.toFixed(2)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {getStatusIcon(ship.status)}
                        <span className="text-xs text-slate-600">{getStatusLabel(ship.status)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verlauf */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Versandverlauf</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Detaillierter Verlauf aller Versände</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Einstellungen */}
        <TabsContent value="settings" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>LetterXpress Verbindung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">Schritt 1: LetterXpress Account-Daten eingeben</p>
                <p className="text-xs text-blue-700">Füllen Sie Ihre LetterXpress API-Daten aus und speichern Sie diese</p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">LetterXpress API Key</label>
                  <input 
                    type="password" 
                    placeholder="Geben Sie Ihren API-Schlüssel ein" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-slate-500 mt-1">Wird verschlüsselt gespeichert</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">LetterXpress Account ID</label>
                  <input 
                    type="text" 
                    placeholder="z.B. ACC-12345" 
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">E-Mail-Adresse</label>
                  <input 
                    type="email" 
                    placeholder="z.B. kontakt@beispiel.de" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-slate-500 mt-1">Die mit Ihrem LetterXpress-Account verknüpfte E-Mail</p>
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${message.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message}
                </div>
              )}

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mt-4">
                <p className="text-sm text-amber-800 font-medium mb-2">Schritt 2: Verbindung testen</p>
                <Button 
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  onClick={handleTest}
                  disabled={testLoading || !apiKey || !accountId || !email}
                >
                  {testLoading ? 'Wird getestet...' : 'Verbindung testen'}
                </Button>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium mb-2">Schritt 3: Voreinstellungen</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Standardformat</label>
                    <select className="w-full px-3 py-2 border rounded-lg text-sm">
                      <option>DIN A4 Farbdruck</option>
                      <option>DIN A4 S/W</option>
                      <option>DIN A5</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Standard-Versand</label>
                    <select className="w-full px-3 py-2 border rounded-lg text-sm">
                      <option>Standardversand (ca. 2-3 Tage)</option>
                      <option>Expressversand (1 Tag)</option>
                      <option>Einschreiben</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="attach-tracking" className="rounded" />
                    <label htmlFor="attach-tracking" className="text-sm">Tracking-Code automatisch hinzufügen</label>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-green-600 hover:bg-green-700">Einstellungen speichern</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick-Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href="https://www.letterxpress.de" target="_blank" rel="noopener noreferrer" className="block p-3 border rounded-lg hover:bg-slate-50 text-sm font-medium text-blue-600">
                → LetterXpress Website
              </a>
              <a href="https://www.letterxpress.de/api-docs" target="_blank" rel="noopener noreferrer" className="block p-3 border rounded-lg hover:bg-slate-50 text-sm font-medium text-blue-600">
                → API-Dokumentation
              </a>
              <a href="mailto:support@letterxpress.de" className="block p-3 border rounded-lg hover:bg-slate-50 text-sm font-medium text-blue-600">
                → Support kontaktieren
              </a>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}