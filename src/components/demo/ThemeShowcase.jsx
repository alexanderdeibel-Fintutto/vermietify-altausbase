import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, AlertTriangle, Info, TrendingUp, TrendingDown,
  Building2, Users, Euro, Calculator, FileText, Palette, Home
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function ThemeShowcase() {
  const [count, setCount] = useState(0);

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="vf-page-header">
        <div>
          <h1 className="vf-page-title">vermitify Design-System</h1>
          <p className="vf-page-subtitle">Classic Ocean Sunset Theme - Alle Komponenten im Überblick</p>
        </div>
        <div className="vf-page-actions">
          <Button variant="secondary" size="sm">Dokumentation</Button>
          <Button variant="gradient" size="md">Jetzt upgraden</Button>
        </div>
      </div>

      {/* Buttons Section */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="sm">Primary SM</Button>
            <Button variant="primary" size="md">Primary MD</Button>
            <Button variant="primary" size="lg">Primary LG</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="gradient">Gradient Premium</Button>
            <Button variant="accent">Accent Orange</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="icon">
              <Building2 className="w-5 h-5" />
            </Button>
            <Button variant="secondary" size="icon">
              <Users className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Calculator className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Badges Section */}
      <Card>
        <CardHeader>
          <CardTitle>Badges & Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Entwurf</Badge>
            <Badge variant="primary">Aktiv</Badge>
            <Badge variant="accent">Neu</Badge>
            <Badge variant="success">Bezahlt</Badge>
            <Badge variant="warning">Ausstehend</Badge>
            <Badge variant="error">Überfällig</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="gradient">Premium</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="vf-stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="vf-stat-card-label">Objekte gesamt</span>
            <Building2 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="vf-stat-card-value">12</div>
          <div className="vf-stat-card-trend positive">
            <TrendingUp className="w-4 h-4" />
            +2 diesen Monat
          </div>
        </div>

        <div className="vf-stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="vf-stat-card-label">Monatliche Miete</span>
            <Euro className="w-5 h-5 text-slate-400" />
          </div>
          <div className="vf-stat-card-value">8.450 €</div>
          <div className="vf-stat-card-trend positive">
            <TrendingUp className="w-4 h-4" />
            +3,2%
          </div>
        </div>

        <div className="vf-stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="vf-stat-card-label">Offene Rechnungen</span>
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <div className="vf-stat-card-value">3</div>
          <div className="vf-stat-card-trend negative">
            <TrendingDown className="w-4 h-4" />
            Fällig
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="space-y-3">
        <Alert variant="success">
          <CheckCircle className="h-5 w-5" />
          <div className="flex-1">
            <AlertTitle>Erfolg</AlertTitle>
            <AlertDescription>Die Daten wurden erfolgreich gespeichert.</AlertDescription>
          </div>
        </Alert>

        <Alert variant="warning">
          <AlertTriangle className="h-5 w-5" />
          <div className="flex-1">
            <AlertTitle>Warnung</AlertTitle>
            <AlertDescription>Die Nebenkostenabrechnung muss bis 31.12.2026 versendet werden.</AlertDescription>
          </div>
        </Alert>

        <Alert variant="error">
          <AlertTriangle className="h-5 w-5" />
          <div className="flex-1">
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>Die Miete für Wohnung 2A ist seit 15 Tagen überfällig.</AlertDescription>
          </div>
        </Alert>

        <Alert variant="info">
          <Info className="h-5 w-5" />
          <div className="flex-1">
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>Neue Features sind verfügbar. Klicken Sie hier für Details.</AlertDescription>
          </div>
        </Alert>
      </div>

      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle>Formulare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="vf-label vf-label-required">E-Mail-Adresse</Label>
            <Input type="email" placeholder="name@beispiel.de" />
            <p className="vf-input-hint">Ihre geschäftliche E-Mail-Adresse</p>
          </div>

          <div>
            <Label className="vf-label">Kaltmiete</Label>
            <div className="vf-input-group">
              <Input type="number" step="0.01" className="vf-currency-input" placeholder="0,00" />
              <span className="vf-input-suffix">EUR</span>
            </div>
          </div>

          <div>
            <Label className="vf-label">Beschreibung</Label>
            <Textarea placeholder="Geben Sie hier zusätzliche Informationen ein..." />
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="secondary" size="sm">Abbrechen</Button>
          <Button variant="primary" size="sm">Speichern</Button>
        </CardFooter>
      </Card>

      {/* Table Section */}
      <div className="vf-table-container">
        <table className="vf-table">
          <thead>
            <tr>
              <th>Mieter</th>
              <th>Einheit</th>
              <th className="vf-table-cell-currency">Miete</th>
              <th className="vf-table-cell-status">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Max Mustermann</td>
              <td>Whg. 1A</td>
              <td className="vf-table-cell-currency positive">850,00 €</td>
              <td className="vf-table-cell-status">
                <Badge variant="success">Bezahlt</Badge>
              </td>
            </tr>
            <tr>
              <td>Lisa Schmidt</td>
              <td>Whg. 2B</td>
              <td className="vf-table-cell-currency negative">-120,00 €</td>
              <td className="vf-table-cell-status">
                <Badge variant="error">Überfällig</Badge>
              </td>
            </tr>
            <tr>
              <td>Tom Wagner</td>
              <td>Whg. 3C</td>
              <td className="vf-table-cell-currency">780,00 €</td>
              <td className="vf-table-cell-status">
                <Badge variant="warning">Ausstehend</Badge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="vf-empty-state">
          <Building2 className="w-16 h-16 text-slate-200 mb-4" />
          <h3 className="vf-empty-state-title">Noch keine Objekte</h3>
          <p className="text-sm text-slate-500 mb-6">Erstellen Sie Ihr erstes Objekt, um zu starten.</p>
          <Button variant="primary">+ Objekt anlegen</Button>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tabs Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Übersicht</TabsTrigger>
              <TabsTrigger value="finance">Finanzen</TabsTrigger>
              <TabsTrigger value="documents">Dokumente</TabsTrigger>
              <TabsTrigger value="settings">Einstellungen</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <p className="text-sm text-slate-600">Übersicht der wichtigsten Kennzahlen und Informationen.</p>
            </TabsContent>
            <TabsContent value="finance" className="mt-4">
              <p className="text-sm text-slate-600">Finanzielle Auswertungen und Transaktionen.</p>
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              <p className="text-sm text-slate-600">Alle Dokumente und Verträge an einem Ort.</p>
            </TabsContent>
            <TabsContent value="settings" className="mt-4">
              <p className="text-sm text-slate-600">Systemeinstellungen und Konfiguration.</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Color Palette Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Classic Ocean Sunset Palette
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Primary (Ocean Blue)</p>
            <div className="flex gap-2">
              <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: '#1E3A8A' }} title="#1E3A8A" />
              <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: '#3B5998' }} title="#3B5998" />
              <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: '#EEF2FF' }} title="#EEF2FF" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Accent (Sunset Orange)</p>
            <div className="flex gap-2">
              <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: '#F97316' }} title="#F97316" />
              <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: '#EA580C' }} title="#EA580C" />
              <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: '#FFEDD5' }} title="#FFEDD5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Gradient</p>
            <div className="w-full h-12 rounded-lg" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #F97316 100%)' }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}