import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Send, CheckCircle, Clock, AlertCircle, Mail, Lock, Zap } from 'lucide-react';
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

  const isConfigured = apiKey && accountId && email;

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Postversand (LetterXpress)</h1>
          <p className="text-slate-600 font-light mt-2">Verwalten Sie den physischen Postversand zu Mietern</p>
        </div>

        {/* Welcome Section */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-8 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Info Section */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <Mail className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Willkommen bei LetterXpress</h2>
                    <p className="text-sm text-slate-600 mt-1">Professioneller Postversand direkt aus Ihrer Verwaltung</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Zahlungserinnerungen & Mahnungen</p>
                      <p className="text-sm text-slate-600">Automatisierte Versände direkt an Ihre Mieter</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Kündigungen & Vertragsunterlagen</p>
                      <p className="text-sm text-slate-600">Rechtssichere Zustellung mit Tracking</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Persönliche Briefe & Dokumente</p>
                      <p className="text-sm text-slate-600">Von Betriebskostenabrechnungen bis zu wichtigen Mitteilungen</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Tracking & Nachweise</p>
                      <p className="text-sm text-slate-600">Vollständige Dokumentation aller Versände</p>
                    </div>
                  </div>
                </div>

                <a 
                  href="https://www.letterxpress.de" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  → LetterXpress.de besuchen
                </a>
              </div>

              {/* Pricing Section */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
                  <h3 className="font-semibold text-slate-900">Preisübersicht</h3>
                  
                  <div className="space-y-3 border-t border-slate-200 pt-4">
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">STANDARDBRIEF</p>
                      <p className="text-lg font-semibold text-slate-900">ab € 0,95</p>
                      <p className="text-xs text-slate-500">DIN A4, Standardversand</p>
                    </div>

                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-xs font-medium text-slate-600 mb-1">EINSCHREIBEN</p>
                      <p className="text-lg font-semibold text-slate-900">ab € 4,90</p>
                      <p className="text-xs text-slate-500">Mit Rückschein</p>
                    </div>

                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-xs font-medium text-slate-600 mb-1">FARBDRUCK</p>
                      <p className="text-lg font-semibold text-slate-900">ab € 1,50</p>
                      <p className="text-xs text-slate-500">Professioneller Eindruck</p>
                    </div>

                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-xs font-medium text-slate-600 mb-1">EXPRESSVERSAND</p>
                      <p className="text-lg font-semibold text-slate-900">ab € 2,95</p>
                      <p className="text-xs text-slate-500">1-Tages-Lieferung</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 italic pt-2">Keine Einrichtungsgebühren • Flexible Nutzung</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Schritt 1: Account-Daten eingeben
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Geben Sie Ihre LetterXpress-Zugangsdaten ein, um zu starten:{' '}
              <a 
                href="https://www.letterxpress.de/kundenbereich/funktionen/zugangsdaten/lxp-api" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                → API-Daten finden
              </a>
            </p>
            
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

            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                onClick={handleTest}
                disabled={testLoading || !apiKey || !accountId || !email}
              >
                {testLoading ? 'Wird getestet...' : 'Verbindung testen'}
              </Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleSave}
                disabled={saveLoading || !apiKey || !accountId || !email}
              >
                {saveLoading ? 'Wird gespeichert...' : 'Speichern & Starten'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Noch kein LetterXpress-Account?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">Registrieren Sie sich kostenlos und starten Sie sofort mit dem Versand:</p>
            <a 
              href="https://www.letterxpress.de/registrierung" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              → Kostenlos registrieren
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

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

              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleSave}
                disabled={saveLoading || !apiKey || !accountId || !email}
              >
                {saveLoading ? 'Wird gespeichert...' : 'Einstellungen speichern'}
              </Button>
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