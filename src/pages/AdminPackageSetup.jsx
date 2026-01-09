import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPackageSetup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const seedTemplates = async () => {
    setLoading(true);
    try {
      // Create all package templates
      const templates = [
        {
          package_type: 'easyKonto',
          package_name: 'Easy Konto',
          base_price: 9.99,
          max_buildings: 0,
          max_units: 0,
          included_modules: ['finanzen', 'banking'],
          available_addons: ['dokumentation', 'kommunikation', 'aufgaben'],
          description: 'Reine Finanzverwaltung ohne Immobilien',
          is_active: true
        },
        {
          package_type: 'easySteuer',
          package_name: 'Easy Steuer',
          base_price: 19.99,
          max_buildings: 0,
          max_units: 0,
          included_modules: ['finanzen', 'banking', 'steuer'],
          available_addons: ['dokumentation', 'kommunikation', 'aufgaben'],
          description: 'Finanzen + Steuer-Modul',
          is_active: true
        },
        {
          package_type: 'easyHome',
          package_name: 'Easy Home',
          base_price: 29.99,
          max_buildings: 1,
          max_units: 1,
          included_modules: ['finanzen', 'banking', 'steuer', 'objekte', 'eigentuemerVW'],
          available_addons: ['dokumentation', 'kommunikation', 'aufgaben', 'mieter', 'vertraege'],
          description: 'Für Eigenheimbesitzer mit 1 Objekt',
          is_active: true
        },
        {
          package_type: 'easyVermieter',
          package_name: 'Easy Vermieter',
          base_price: 39.99,
          max_buildings: 999,
          max_units: 999,
          included_modules: ['finanzen', 'banking', 'steuer', 'objekte', 'eigentuemerVW', 'mieter', 'vertraege', 'betriebskosten'],
          available_addons: ['dokumentation', 'kommunikation', 'aufgaben'],
          description: 'Vollständige Vermieterlösung',
          is_active: true
        },
        {
          package_type: 'easyGewerbe',
          package_name: 'Easy Gewerbe',
          base_price: 49.99,
          max_buildings: 999,
          max_units: 999,
          included_modules: ['finanzen', 'banking', 'steuer', 'objekte', 'eigentuemerVW', 'mieter', 'vertraege', 'betriebskosten', 'firma'],
          available_addons: ['dokumentation', 'kommunikation', 'aufgaben'],
          description: 'Für gewerbliche Vermieter',
          is_active: true
        }
      ];

      for (const template of templates) {
        await base44.asServiceRole.entities.PackageTemplate.create(template);
      }

      toast.success('Templates erstellt');
      setResult({ step: 'templates', success: true });
    } catch (error) {
      toast.error('Fehler beim Erstellen der Templates');
      setResult({ step: 'templates', success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const migrateUsers = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('migrateUsersToPackages', {});
      setResult({ step: 'migration', success: true, data: response.data });
      toast.success(`${response.data.migrated} Benutzer migriert`);
    } catch (error) {
      setResult({ step: 'migration', success: false, error: error.message });
      toast.error('Fehler bei Migration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🚀 Paket-System Setup</h1>
        <p className="text-slate-600 mt-1">Initialisierung des modularen Paket-Systems</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Templates erstellen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Erstellt alle 5 Paket-Templates (easyKonto bis easyGewerbe) mit Modul-Zuordnungen.
            </p>
            <Button 
              onClick={seedTemplates} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Templates initialisieren
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. User migrieren</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Migriert alle bestehenden User auf "easyVermieter" (Full-Access) mit allen Add-ons.
            </p>
            <Button 
              onClick={migrateUsers} 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              User migrieren
            </Button>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              Setup Ergebnis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-50 p-4 rounded-lg text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}