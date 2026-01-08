import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, DollarSign, Users, TrendingUp } from 'lucide-react';
import ModuleCard from '@/components/modules/ModuleCard';
import { toast } from 'sonner';

export default function ModuleManagement() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const queryClient = useQueryClient();

  const { data: modulePricing = [] } = useQuery({
    queryKey: ['module-pricing'],
    queryFn: () => base44.asServiceRole.entities.ModulePricing.list()
  });

  const { data: moduleAccess = [] } = useQuery({
    queryKey: ['module-access'],
    queryFn: () => base44.asServiceRole.entities.ModuleAccess.list()
  });

  const bookModuleMutation = useMutation({
    mutationFn: async (moduleCode) => {
      const response = await base44.functions.invoke('activateModule', {
        moduleCode,
        billingCycle: 'monthly'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-access'] });
      toast.success('Modul erfolgreich gebucht');
    }
  });

  const activeModules = moduleAccess.filter(ma => ma.is_active);
  const totalRevenue = activeModules.reduce((sum, ma) => sum + (ma.price_paid || 0), 0);

  const bookedModuleCodes = activeModules.map(ma => ma.module_code);

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Modul-Verwaltung</h1>
          <p className="text-slate-600">Verwalten Sie gebuchte Module und Preise</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Package, label: "Verfügbare Module", value: modulePricing.length, color: "blue" },
          { icon: Package, label: "Aktive Module", value: activeModules.length, color: "emerald" },
          { icon: DollarSign, label: "Gesamtumsatz", value: `${totalRevenue}€`, color: "purple" },
          { icon: Users, label: "Accounts", value: new Set(moduleAccess.map(ma => ma.account_id)).size, color: "orange" }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
          >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color === 'blue' || stat.color === 'emerald' || stat.color === 'purple' || stat.color === 'orange' ? `text-${stat.color}-600` : ''}`}>
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
            </div>
          </CardContent>
        </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="pricing">Preise</TabsTrigger>
          <TabsTrigger value="booked">Gebuchte Module</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modulePricing.filter(mp => mp.is_active).map(module => (
              <ModuleCard
                key={module.id}
                module={module}
                isBooked={bookedModuleCodes.includes(module.module_code)}
                onBook={() => bookModuleMutation.mutate(module.module_code)}
                disabled={bookModuleMutation.isPending}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Modul-Preise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {modulePricing.map(module => (
                  <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{module.module_name}</div>
                      <Badge className={
                        module.category === 'core' ? 'bg-blue-100 text-blue-800' :
                        module.category === 'app_package' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }>
                        {module.category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-600">
                        {module.price_monthly}€/Monat
                      </div>
                      <div className="text-sm text-slate-600">
                        {module.price_yearly}€/Jahr
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="booked" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gebuchte Module ({activeModules.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {activeModules.length === 0 ? (
                <p className="text-center text-slate-600 py-8">Keine Module gebucht</p>
              ) : (
                <div className="space-y-3">
                  {activeModules.map(access => {
                    const module = modulePricing.find(mp => mp.module_code === access.module_code);
                    return (
                      <div key={access.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{module?.module_name || access.module_code}</div>
                          <div className="text-sm text-slate-600">
                            Gebucht am {new Date(access.purchased_date).toLocaleDateString('de-DE')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{access.price_paid}€</div>
                          <Badge>{access.billing_cycle}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            </Card>
            </TabsContent>
            </Tabs>
            </motion.div>
            </div>
            );
            }