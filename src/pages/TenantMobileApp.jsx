import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MobileTenantDashboard from '@/components/tenant-app/MobileTenantDashboard';
import TenantOnboardingChecklist from '@/components/tenant-app/TenantOnboardingChecklist';
import TenantDigitalKeyAccess from '@/components/tenant-app/TenantDigitalKeyAccess';
import TenantDirectMessaging from '@/components/tenant-app/TenantDirectMessaging';
import TenantDocumentAccess from '@/components/tenant-app/TenantDocumentAccess';
import TenantMaintenanceRequest from '@/components/tenant-app/TenantMaintenanceRequest';
import TenantFavoritesManager from '@/components/tenant-portal/TenantFavoritesManager';
import TenantNotificationCenter from '@/components/tenant-portal/TenantNotificationCenter';
import { Home, Key, MessageSquare, FileText, Wrench, CheckSquare, Star, Bell, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TenantMobileApp() {
  const [activeTab, setActiveTab] = useState('home');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant-data', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const tenants = await base44.entities.Tenant.filter({ email: user.email });
      return tenants[0];
    },
    enabled: !!user?.email
  });

  const { data: contract } = useQuery({
    queryKey: ['tenant-contract', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      const contracts = await base44.entities.LeaseContract.filter({ tenant_id: tenant.id, status: 'active' });
      return contracts[0];
    },
    enabled: !!tenant?.id
  });

  if (!tenant || !contract) {
    return <div className="text-center py-12">Lade Mieter-Daten...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-4">
        {activeTab === 'home' && (
          <div className="space-y-4">
            <MobileTenantDashboard tenantId={tenant.id} companyId={tenant.company_id} />
            <TenantFavoritesManager tenantId={tenant.id} />
          </div>
        )}
        {activeTab === 'notifications' && (
          <TenantNotificationCenter tenantId={tenant.id} />
        )}
        {activeTab === 'onboarding' && (
          <TenantOnboardingChecklist tenantId={tenant.id} />
        )}
        {activeTab === 'key' && (
          <TenantDigitalKeyAccess tenantId={tenant.id} />
        )}
        {activeTab === 'messages' && (
          <TenantDirectMessaging tenantId={tenant.id} companyId={tenant.company_id} />
        )}
        {activeTab === 'documents' && (
          <TenantDocumentAccess tenantId={tenant.id} />
        )}
        {activeTab === 'maintenance' && (
          <TenantMaintenanceRequest tenantId={tenant.id} unitId={contract.unit_id} companyId={tenant.company_id} />
        )}
        {activeTab === 'community' && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-700 mb-3">Vernetzen Sie sich mit Ihren Nachbarn</p>
              <Link to={createPageUrl('TenantCommunity')}>
                <Button>Zur Community</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-1 py-2 lg:hidden">
        <div className="flex justify-around max-w-2xl mx-auto">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'notifications', icon: Bell, label: 'News' },
            { id: 'messages', icon: MessageSquare, label: 'Chat' },
            { id: 'community', icon: Users, label: 'Community' },
            { id: 'maintenance', icon: Wrench, label: 'Service' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                activeTab === tab.id ? 'bg-slate-800 text-white' : 'text-slate-600'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}