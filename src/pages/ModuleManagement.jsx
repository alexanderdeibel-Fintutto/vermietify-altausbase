import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Check, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

export default function ModuleManagement() {
  const queryClient = useQueryClient();

  const { data: activeModules = [] } = useQuery({
    queryKey: ['active-modules'],
    queryFn: () => base44.asServiceRole.entities.ModuleAccess.filter({ is_active: true })
  });

  const { data: allPricing = [] } = useQuery({
    queryKey: ['module-pricing'],
    queryFn: () => base44.asServiceRole.entities.ModulePricing.list()
  });

  const toggleAutoRenewMutation = useMutation({
    mutationFn: ({ id, auto_renew }) => base44.asServiceRole.entities.ModuleAccess.update(id, { auto_renew }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-modules'] });
      toast.success('Einstellung aktualisiert');
    }
  });

  const activateModuleMutation = useMutation({
    mutationFn: ({ moduleCode, billingCycle }) => base44.functions.invoke('activateModule', { moduleCode, billingCycle }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['active-modules'] });
      toast.success(response.data.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Fehler beim Aktivieren');
    }
  });

  const coreModules = allPricing.filter(p => p.category === 'core');
  const appPackages = allPricing.filter(p => p.category === 'app_package');
  const addons = allPricing.filter(p => p.category === 'addon');

  const isModuleActive = (moduleCode) => {
    return activeModules.some(am => am.module_code === moduleCode);
  };

  const getModuleName = (moduleCode) => {
    const pricing = allPricing.find(p => p.module_code === moduleCode);
    return pricing?.module_name || moduleCode;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Modul-Verwaltung</h1>
          <p className="text-slate-600">Verwalten Sie gebuchte Module und Preise</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Package className="w-4 h-4 mr-2" />
          Modul hinzubuchen
        </Button>
      </div>

      {/* Aktuell gebuchte Module */}
      <Card>
        <CardHeader>
          <CardTitle>Gebuchte Module</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeModules.map(module => {
              const pricing = allPricing.find(p => p.module_code === module.module_code);
              return (
                <Card key={module.id} className="p-4 border-emerald-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium">{pricing?.module_name || module.module_code}</div>
                      <div className="text-sm text-slate-600">{pricing?.description}</div>
                    </div>
                    <Badge variant="default" className="bg-emerald-600">Aktiv</Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Preis:</span>
                      <span className="font-medium">
                        {module.price_paid}€/{module.billing_cycle === 'monthly' ? 'Monat' : 'Jahr'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gebucht:</span>
                      <span>{format(new Date(module.purchased_date), "dd.MM.yyyy", { locale: de })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Läuft ab:</span>
                      <span>
                        {module.expires_date ? format(new Date(module.expires_date), "dd.MM.yyyy", { locale: de }) : "Unbegrenzt"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Auto-Verlängerung:</span>
                      <Switch 
                        checked={module.auto_renew}
                        onCheckedChange={(checked) => toggleAutoRenewMutation.mutate({ 
                          id: module.id, 
                          auto_renew: checked 
                        })}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Verfügbare Module */}
      <Card>
        <CardHeader>
          <CardTitle>Verfügbare Module</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="core">
            <TabsList>
              <TabsTrigger value="core">Core-Module</TabsTrigger>
              <TabsTrigger value="packages">App-Pakete</TabsTrigger>
            </TabsList>
            
            <TabsContent value="core" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coreModules.map(module => {
                  const isBooked = isModuleActive(module.module_code);
                  return (
                    <Card key={module.module_code} className={isBooked ? "opacity-50" : ""}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">{module.module_name}</h3>
                            <p className="text-sm text-slate-600 mt-1">{module.description}</p>
                          </div>
                          {isBooked && <Badge variant="secondary">Gebucht</Badge>}
                        </div>
                        
                        <div className="space-y-3">
                          <div className="text-2xl font-bold text-emerald-600">
                            {module.price_monthly}€
                            <span className="text-sm font-normal text-slate-600">/Monat</span>
                          </div>
                          
                          <div className="space-y-2">
                            {module.features?.map(feature => (
                              <div key={feature} className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-emerald-600" />
                                {feature}
                              </div>
                            ))}
                          </div>
                          
                          <Button 
                            className="w-full" 
                            disabled={isBooked || activateModuleMutation.isPending}
                            onClick={() => activateModuleMutation.mutate({ 
                              moduleCode: module.module_code, 
                              billingCycle: 'monthly' 
                            })}
                          >
                            {isBooked ? "Bereits gebucht" : "Modul buchen"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="packages" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appPackages.map(pkg => {
                  const isBooked = isModuleActive(pkg.module_code);
                  return (
                    <Card key={pkg.module_code} className={`p-6 ${isBooked ? "border-emerald-200 bg-emerald-50" : ""}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold">{pkg.module_name}</h3>
                          <p className="text-slate-600 mt-1">{pkg.description}</p>
                        </div>
                        {isBooked && <Badge className="bg-emerald-600">Aktiv</Badge>}
                      </div>
                      
                      <div className="space-y-4">
                        <div className="text-3xl font-bold text-emerald-600">
                          {pkg.price_monthly}€
                          <span className="text-lg font-normal text-slate-600">/Monat</span>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium mb-2">Enthaltene Module:</div>
                          <div className="flex flex-wrap gap-1">
                            {pkg.dependencies?.map(moduleCode => (
                              <Badge key={moduleCode} variant="outline" className="text-xs">
                                {getModuleName(moduleCode)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium mb-2">Exklusive Features:</div>
                          <div className="space-y-1">
                            {pkg.features?.map(feature => (
                              <div key={feature} className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-emerald-600" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full" 
                          size="lg"
                          disabled={isBooked || activateModuleMutation.isPending}
                          onClick={() => activateModuleMutation.mutate({ 
                            moduleCode: pkg.module_code, 
                            billingCycle: 'monthly' 
                          })}
                        >
                          {isBooked ? "Bereits gebucht" : `${pkg.module_name} buchen`}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}