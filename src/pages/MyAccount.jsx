import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Plus, Zap, CreditCard, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function MyAccount() {
  const queryClient = useQueryClient();
  const [selectedAddon, setSelectedAddon] = useState(null);

  const { data: packageConfig } = useQuery({
    queryKey: ['my-package'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const configs = await base44.entities.UserPackageConfiguration.filter({
        user_id: user.id,
        is_active: true
      });
      return configs[0];
    }
  });

  const { data: packageTemplate } = useQuery({
    queryKey: ['my-package-template', packageConfig?.package_type],
    queryFn: () => {
      if (!packageConfig) return null;
      return base44.asServiceRole.entities.PackageTemplate.filter({
        package_type: packageConfig.package_type
      }).then(t => t[0]);
    },
    enabled: !!packageConfig
  });

  const addAddonMutation = useMutation({
    mutationFn: async (addonName) => {
      const updated = {
        ...packageConfig,
        additional_modules: [...(packageConfig.additional_modules || []), addonName]
      };
      await base44.entities.UserPackageConfiguration.update(packageConfig.id, updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-package'] });
      toast.success('Add-on hinzugefügt');
      setSelectedAddon(null);
    }
  });

  const ADDON_PRICES = {
    'dokumentation': 10,
    'kommunikation': 15,
    'aufgaben': 20
  };

  const ADDON_NAMES = {
    'dokumentation': '📄 Dokumentenverwaltung',
    'kommunikation': '📧 Kommunikation',
    'aufgaben': '✅ Aufgaben & Workflows'
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">👤 Mein Account</h1>
        <p className="text-slate-600 mt-1">Verwalten Sie Ihr Paket und Zusatzmodule</p>
      </div>

      <Tabs defaultValue="package">
        <TabsList>
          <TabsTrigger value="package">Paket</TabsTrigger>
          <TabsTrigger value="switchPackage">Paket wechseln</TabsTrigger>
          <TabsTrigger value="addons">Add-ons</TabsTrigger>
          <TabsTrigger value="billing">Abrechnung</TabsTrigger>
        </TabsList>

        <TabsContent value="package" className="space-y-4">
          {packageConfig && packageTemplate && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Aktuelles Paket</CardTitle>
                  <Badge className="bg-blue-100 text-blue-800">
                    <Package className="w-3 h-3 mr-2" />
                    {packageTemplate.package_name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Paket-Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Monatlicher Preis</p>
                    <p className="text-2xl font-bold">€{packageConfig.price_per_month}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Max Objekte</p>
                    <p className="text-2xl font-bold">{packageConfig.max_buildings || '∞'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Max Wohneinheiten</p>
                    <p className="text-2xl font-bold">{packageConfig.max_units || '∞'}</p>
                  </div>
                </div>

                {/* Enthaltene Module */}
                <div>
                  <p className="font-medium mb-3">Enthaltene Module:</p>
                  <div className="flex flex-wrap gap-2">
                    {packageTemplate.included_modules?.map(module => (
                      <Badge key={module} variant="outline" className="bg-green-50 text-green-800">
                        ✓ {module}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Upgrade Button */}
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Zap className="w-4 h-4 mr-2" />
                  Auf höheres Paket upgraden
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="addons" className="space-y-4">
          {packageConfig && (
            <>
              {/* Bereits gebuchte Add-ons */}
              {packageConfig.additional_modules?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Aktive Add-ons</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {packageConfig.additional_modules.map(addon => (
                      <div key={addon} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                        <p className="font-medium">{ADDON_NAMES[addon]}</p>
                        <Badge className="bg-green-100 text-green-800">
                          +€{ADDON_PRICES[addon]}/M
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Verfügbare Add-ons */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Verfügbare Add-ons</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(ADDON_NAMES).map(([key, name]) => {
                    const isActive = packageConfig.additional_modules?.includes(key);
                    if (isActive) return null;

                    return (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{name}</p>
                          <p className="text-xs text-slate-600">Erweitern Sie Ihre Funktionen</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold mb-2">€{ADDON_PRICES[key]}/M</p>
                          <Button
                            size="sm"
                            onClick={() => addAddonMutation.mutate(key)}
                            disabled={addAddonMutation.isPending}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Hinzufügen
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Zahlungsinformationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Zahlungsart</p>
                <p className="font-medium">Kreditkarte (Visa •••• 4242)</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Nächste Abrechnung</p>
                <p className="font-medium">
                  {new Date(new Date().setDate(new Date().getDate() + 7)).toLocaleDateString('de-DE')}
                </p>
              </div>

              <Button variant="outline" className="w-full">
                Rechnungen herunterladen
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}