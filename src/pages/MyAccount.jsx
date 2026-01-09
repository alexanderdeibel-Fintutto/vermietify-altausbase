import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Plus, Zap, CreditCard, Users } from 'lucide-react';
import { toast } from 'sonner';
import LimitWarningBanner from '@/components/package/LimitWarningBanner';
import AddOnManager from '@/components/package/AddOnManager';
import PackageSwitcher from '@/components/package/PackageSwitcher';
import UsageAnalyticsDashboard from '@/components/package/UsageAnalyticsDashboard';
import BillingHistory from '@/components/package/BillingHistory';

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
      <LimitWarningBanner />
      
      <div>
        <h1 className="text-3xl font-light">Mein Account</h1>
        <p className="text-slate-600 mt-1">Verwalten Sie Ihr Paket und Zusatzmodule</p>
      </div>

      <Tabs defaultValue="package">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="package">Paket & Nutzung</TabsTrigger>
          <TabsTrigger value="addons">Add-ons</TabsTrigger>
          <TabsTrigger value="billing">Rechnungen</TabsTrigger>
        </TabsList>

        <TabsContent value="package" className="space-y-6">
          <UsageAnalyticsDashboard />
          {packageConfig && (
            <PackageSwitcher currentPackage={packageConfig.package_type} />
          )}
        </TabsContent>

        <TabsContent value="addons">
          {packageConfig && (
            <AddOnManager packageConfig={packageConfig} />
          )}
        </TabsContent>

        <TabsContent value="billing">
          <BillingHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}