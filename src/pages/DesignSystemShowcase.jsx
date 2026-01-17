import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { VfDialog, VfDialogTrigger, VfDialogContent, VfDialogHeader, VfDialogTitle, VfDialogDescription, VfDialogBody, VfDialogFooter } from '@/components/ui/vf-dialog';
import { VfEmptyState } from '@/components/ui/vf-empty-state';
import { VfDataField } from '@/components/data-display/VfDataField';
import { VfDataGrid } from '@/components/data-display/VfDataGrid';
import { VfKeyValueList } from '@/components/data-display/VfKeyValueList';
import { VfHero } from '@/components/marketing/VfHero';
import { VfFeatureSection } from '@/components/marketing/VfFeatureSection';
import { VfPricingSection } from '@/components/marketing/VfPricingSection';
import { VfPageHeader } from '@/components/ui/page-header';
import { VfBreadcrumb } from '@/components/ui/breadcrumb-vf';
import { 
  Home, Building2, TrendingUp, Zap, Shield, Users, 
  CheckCircle, AlertCircle, Info, AlertTriangle, Inbox
} from 'lucide-react';

export default function DesignSystemShowcase() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-12 pb-16">
      <VfPageHeader
        title="Vermitify Design System"
        subtitle="Classic Ocean Sunset Theme - Alle Komponenten"
        actions={
          <>
            <Button variant="outline">Dokumentation</Button>
            <Button variant="gradient">Export Code</Button>
          </>
        }
      />

      <VfBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Design System", href: "/design-system" },
          { label: "Showcase" }
        ]}
      />

      {/* Buttons */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Buttons</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="gradient">Gradient</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon"><Home className="h-4 w-4" /></Button>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Standard Card</CardTitle>
              <CardDescription>Eine einfache Card-Komponente</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--theme-text-secondary)]">
                Dies ist der Inhalt der Card mit Text und Informationen.
              </p>
            </CardContent>
          </Card>

          <div className="vf-stat-card">
            <div className="vf-stat-card-header">
              <span className="vf-stat-card-label">Gesamteinnahmen</span>
              <Building2 className="vf-stat-card-icon" />
            </div>
            <div className="vf-stat-card-value">42.850 €</div>
            <div className="vf-stat-card-trend positive">
              <TrendingUp className="h-4 w-4" />
              +12,5%
            </div>
          </div>

          <div className="vf-stat-card vf-stat-card-highlighted">
            <div className="vf-stat-card-header">
              <span className="vf-stat-card-label">Premium Card</span>
              <Zap className="vf-stat-card-icon" />
            </div>
            <div className="vf-stat-card-value">1.234</div>
            <div className="vf-stat-card-trend">
              Aktive Objekte
            </div>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Badges</h2>
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="gradient">Gradient</Badge>
          <Badge variant="success" dot>Mit Dot</Badge>
        </div>
      </section>

      {/* Form Elements */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Form Elements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label required>E-Mail-Adresse</Label>
            <Input type="email" placeholder="name@beispiel.de" />
          </div>
          <div>
            <Label>Mit Fehler</Label>
            <Input error placeholder="Fehlerhafte Eingabe" />
            <div className="vf-input-error-message">Dies ist eine Fehlermeldung</div>
          </div>
          <div className="md:col-span-2">
            <Label>Beschreibung</Label>
            <Textarea placeholder="Geben Sie eine Beschreibung ein..." />
          </div>
        </div>
      </section>

      {/* Alerts */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Alerts</h2>
        <div className="space-y-4">
          <Alert variant="info" icon={<Info className="h-5 w-5" />}>
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>Dies ist eine informative Nachricht für den Benutzer.</AlertDescription>
          </Alert>
          <Alert variant="success" icon={<CheckCircle className="h-5 w-5" />}>
            <AlertTitle>Erfolgreich</AlertTitle>
            <AlertDescription>Die Operation wurde erfolgreich abgeschlossen.</AlertDescription>
          </Alert>
          <Alert variant="warning" icon={<AlertTriangle className="h-5 w-5" />}>
            <AlertTitle>Warnung</AlertTitle>
            <AlertDescription>Bitte überprüfen Sie Ihre Eingaben.</AlertDescription>
          </Alert>
          <Alert variant="error" icon={<AlertCircle className="h-5 w-5" />}>
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.</AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Progress & Loading */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Progress & Loading</h2>
        <div className="space-y-6">
          <div>
            <Label>Standard Progress</Label>
            <Progress value={65} className="mt-2" />
          </div>
          <div>
            <Label>Gradient Progress</Label>
            <Progress value={85} variant="gradient" className="mt-2" />
          </div>
          <div>
            <Label>Success Progress</Label>
            <Progress value={100} variant="success" size="lg" className="mt-2" />
          </div>
          <div className="flex gap-4 items-center">
            <Spinner size="xs" />
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
            <Spinner size="xl" />
          </div>
        </div>
      </section>

      {/* Data Display */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Data Display</h2>
        <VfDataGrid columns={3}>
          <VfDataField 
            label="Gebäude-ID" 
            value="BLD-2024-001" 
            copyable 
          />
          <VfDataField 
            label="Gesamtfläche" 
            value="1.245 m²" 
            icon={<Building2 className="h-4 w-4" />}
          />
          <VfDataField 
            label="Eigentümer" 
            value="Max Mustermann" 
          />
        </VfDataGrid>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Vertragsinformationen</CardTitle>
          </CardHeader>
          <CardContent>
            <VfKeyValueList
              striped
              items={[
                { label: "Vertragsnummer", value: "V-2024-042" },
                { label: "Mieter", value: "Anna Schmidt" },
                { label: "Kaltmiete", value: "850,00 €" },
                { label: "Beginn", value: "01.01.2024" },
                { label: "Status", value: "Aktiv" }
              ]}
            />
          </CardContent>
        </Card>
      </section>

      {/* Empty State */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Empty State</h2>
        <Card>
          <CardContent className="p-0">
            <VfEmptyState
              icon={<Inbox className="h-16 w-16" />}
              title="Keine Dokumente vorhanden"
              description="Laden Sie Ihr erstes Dokument hoch, um zu beginnen."
              action={<Button variant="primary">Dokument hochladen</Button>}
            />
          </CardContent>
        </Card>
      </section>

      {/* Dialog */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Dialog</h2>
        <VfDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <VfDialogTrigger asChild>
            <Button>Dialog öffnen</Button>
          </VfDialogTrigger>
          <VfDialogContent>
            <VfDialogHeader>
              <VfDialogTitle>Bestätigung erforderlich</VfDialogTitle>
              <VfDialogDescription>
                Möchten Sie diese Aktion wirklich durchführen?
              </VfDialogDescription>
            </VfDialogHeader>
            <VfDialogBody>
              <p className="text-sm text-[var(--theme-text-secondary)]">
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </VfDialogBody>
            <VfDialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button variant="primary" onClick={() => setDialogOpen(false)}>
                Bestätigen
              </Button>
            </VfDialogFooter>
          </VfDialogContent>
        </VfDialog>
      </section>

      {/* Marketing Hero Example */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Marketing Components</h2>
        <VfHero
          headline="Immobilienverwaltung neu gedacht"
          subheadline="Verwalten Sie Ihre Immobilien effizient und professionell mit modernster Technologie"
          primaryCta={<Button variant="gradient" size="lg">Jetzt starten</Button>}
          secondaryCta={<Button variant="outline" size="lg">Mehr erfahren</Button>}
        />
      </section>

      {/* Features */}
      <VfFeatureSection
        title="Leistungsstarke Funktionen"
        description="Alles was Sie für professionelle Immobilienverwaltung benötigen"
        columns={3}
        features={[
          {
            icon: <Building2 className="h-6 w-6" />,
            title: "Objektverwaltung",
            description: "Verwalten Sie unbegrenzt viele Immobilien an einem Ort"
          },
          {
            icon: <Users className="h-6 w-6" />,
            title: "Mieterverwaltung",
            description: "Komplette Mieterdaten und Kommunikation zentral"
          },
          {
            icon: <Shield className="h-6 w-6" />,
            title: "Rechtssicherheit",
            description: "Alle Dokumente und Prozesse gesetzeskonform"
          }
        ]}
      />

      {/* Pricing */}
      <VfPricingSection
        title="Transparente Preise"
        description="Wählen Sie das passende Paket für Ihre Bedürfnisse"
        plans={[
          {
            name: "Starter",
            price: "29€",
            period: "/Monat",
            features: [
              "Bis zu 5 Objekte",
              "Unbegrenzte Mieter",
              "Basis-Support"
            ],
            cta: <Button variant="outline" className="w-full">Auswählen</Button>
          },
          {
            name: "Professional",
            price: "79€",
            period: "/Monat",
            highlighted: true,
            features: [
              "Unbegrenzte Objekte",
              "Unbegrenzte Mieter",
              "Priority Support",
              "API-Zugang"
            ],
            cta: <Button variant="gradient" className="w-full">Jetzt starten</Button>
          },
          {
            name: "Enterprise",
            price: "Individuell",
            period: "",
            features: [
              "Alles aus Professional",
              "White-Label",
              "Dedizierter Support",
              "SLA garantiert"
            ],
            cta: <Button variant="outline" className="w-full">Kontakt</Button>
          }
        ]}
      />
    </div>
  );
}