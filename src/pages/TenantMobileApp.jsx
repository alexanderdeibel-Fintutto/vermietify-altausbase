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
import { Home, Key, MessageSquare, FileText, Wrench, CheckSquare } from 'lucide-react';

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
          <MobileTenantDashboard tenantId={tenant.id} companyId={tenant.company_id} />
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
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-3 lg:hidden">
        <div className="flex justify-around max-w-2xl mx-auto">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'key', icon: Key, label: 'Schlüssel' },
            { id: 'messages', icon: MessageSquare, label: 'Chat' },
            { id: 'documents', icon: FileText, label: 'Docs' },
            { id: 'maintenance', icon: Wrench, label: 'Service' },
            { id: 'onboarding', icon: CheckSquare, label: 'Tasks' }
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