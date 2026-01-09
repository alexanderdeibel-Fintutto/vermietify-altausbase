import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePackageAccess } from '@/components/hooks/usePackageAccess';
import { CheckCircle2, XCircle, Building2, Home, Users, FileText } from 'lucide-react';

export default function PackageTestPage() {
  const { packageConfig, packageTemplate, hasModuleAccess, canCreateBuilding, canCreateUnit } = usePackageAccess();
  
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-count'],
    queryFn: () => base44.entities.Building.filter({})
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units-count'],
    queryFn: () => base44.entities.Unit.filter({})
  });

  const testModules = [
    'objekte', 'mieter', 'finanzen', 'banking', 'steuer', 
    'betriebskosten', 'dokumentation', 'kommunikation', 'aufgaben'
  ];

  const testBackendValidation = async (endpoint) => {
    try {
      const response = await base44.functions.invoke(endpoint);
      return response.data;
    } catch (error) {
      return { error: error.message };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light">Paket-System Test</h1>
        <p className="text-slate-600 mt-1">Überprüfen Sie die Paket-Konfiguration und Zugriffe</p>
      </div>

      {/* Aktuelle Konfiguration */}
      <Card>
        <CardHeader>
          <CardTitle>Aktuelle Konfiguration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Paket</p>
              <Badge className="text-base">{packageConfig?.package_type || 'Nicht gefunden'}</Badge>
            </div>
            <div>
              <p className="text-sm text-slate-600">Preis</p>
              <p className="font-semibold">{packageConfig?.price_per_month || 0}€/Monat</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Max. Gebäude</p>
              <p className="font-semibold">{packageConfig?.max_buildings || 0}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Max. Einheiten</p>
              <p className="font-semibold">{packageConfig?.max_units || 0}</p>
            </div>
          </div>

          {packageConfig?.additional_modules?.length > 0 && (
            <div>
              <p className="text-sm text-slate-600 mb-2">Zusatzmodule</p>
              <div className="flex gap-2 flex-wrap">
                {packageConfig.additional_modules.map(mod => (
                  <Badge key={mod} variant="outline">{mod}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modul-Zugriffe */}
      <Card>
        <CardHeader>
          <CardTitle>Modul-Zugriffe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {testModules.map(module => {
              const hasAccess = hasModuleAccess(module);
              return (
                <div key={module} className="flex items-center gap-2 p-2 border rounded-lg">
                  {hasAccess ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  )}
                  <span className="text-sm">{module}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Limits & Nutzung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-violet-600" />
                <p className="font-semibold">Gebäude</p>
              </div>
              <p className="text-2xl font-bold">{buildings.length} / {packageConfig?.max_buildings || 0}</p>
              <Button 
                size="sm" 
                className="mt-2"
                onClick={async () => {
                  const result = await testBackendValidation('validateBuildingCreation');
                  alert(JSON.stringify(result, null, 2));
                }}
              >
                Backend-Validierung testen
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-5 h-5 text-blue-600" />
                <p className="font-semibold">Einheiten</p>
              </div>
              <p className="text-2xl font-bold">{units.length} / {packageConfig?.max_units || 0}</p>
              <Button 
                size="sm" 
                className="mt-2"
                onClick={async () => {
                  const result = await testBackendValidation('validateUnitCreation');
                  alert(JSON.stringify(result, null, 2));
                }}
              >
                Backend-Validierung testen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Info */}
      {packageTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Paket-Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-slate-600">Enthaltene Module</p>
              <div className="flex gap-2 flex-wrap mt-1">
                {packageTemplate.included_modules?.map(mod => (
                  <Badge key={mod} className="bg-green-600">{mod}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600">Verfügbare Add-ons</p>
              <div className="flex gap-2 flex-wrap mt-1">
                {packageTemplate.available_addons?.map(mod => (
                  <Badge key={mod} variant="outline">{mod}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}