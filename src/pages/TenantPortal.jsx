import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LogOut, FileText, DollarSign, AlertCircle, MessageSquare } from 'lucide-react';
import TenantPaymentHistory from '@/components/tenant-portal/TenantPaymentHistory';
import TenantDocuments from '@/components/tenant-portal/TenantDocuments';
import TenantCommunication from '@/components/tenant-portal/TenantCommunication';
import MaintenanceRequestForm from '@/components/maintenance/MaintenanceRequestForm';

export default function TenantPortal() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [portalUser, setPortalUser] = useState(null);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const { data: leaseData } = useQuery({
    queryKey: ['tenantLeaseData', email],
    queryFn: async () => {
      if (!email) return null;
      const leases = await base44.entities.LeaseContract.list();
      return leases.find(l => l.tenant_email === email);
    },
    enabled: !!email
  });

  const { data: maintenanceRequests = [] } = useQuery({
    queryKey: ['maintenanceRequests', leaseData?.id],
    queryFn: async () => {
      if (!leaseData?.id) return [];
      const requests = await base44.entities.MaintenanceRequest.list();
      return requests.filter(r => r.lease_contract_id === leaseData.id);
    },
    enabled: !!leaseData?.id
  });

  const pendingMaintenance = maintenanceRequests.filter(r => !['COMPLETED', 'CLOSED'].includes(r.status));

  if (!email || !leaseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Ungültige Anmeldedaten oder Session abgelaufen.</p>
            <Button className="bg-blue-600 hover:bg-blue-700">Erneut anmelden</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mietportal</h1>
            <p className="text-gray-600 mt-1">Willkommen, {leaseData.tenant_name}</p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Abmelden
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aktuelle Miete</p>
                  <p className="text-2xl font-bold">€{leaseData.monthly_rent?.toFixed(2) || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mietbeginn</p>
                  <p className="text-xl font-bold">{new Date(leaseData.start_date).toLocaleDateString('de-DE')}</p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Wartungsanfragen</p>
                  <p className="text-2xl font-bold">{pendingMaintenance.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-lg p-2 shadow">
          {[
            { id: 'overview', label: 'Übersicht', icon: FileText },
            { id: 'payments', label: 'Zahlungen', icon: DollarSign },
            { id: 'documents', label: 'Dokumente', icon: FileText },
            { id: 'maintenance', label: 'Wartung', icon: AlertCircle },
            { id: 'messages', label: 'Nachrichten', icon: MessageSquare }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Areas */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mietvertraginformationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Wohneinheit</p>
                    <p className="font-medium">{leaseData.unit_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Mietdauer</p>
                    <p className="font-medium">
                      {leaseData.end_date 
                        ? new Date(leaseData.end_date).toLocaleDateString('de-DE')
                        : 'Unbefristet'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Kaution</p>
                    <p className="font-medium">€{leaseData.security_deposit?.toFixed(2) || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Nebenkosten</p>
                    <p className="font-medium">€{leaseData.operating_cost_advance?.toFixed(2) || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'payments' && (
          <TenantPaymentHistory leaseId={leaseData.id} tenantEmail={email} />
        )}

        {activeTab === 'documents' && (
          <TenantDocuments leaseId={leaseData.id} />
        )}

        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <MaintenanceRequestForm
              leaseContractId={leaseData.id}
              unitId={leaseData.unit_id}
              tenantEmail={email}
            />
            {maintenanceRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Meine Anfragen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {maintenanceRequests.map(req => (
                    <div key={req.id} className="p-3 border rounded flex justify-between items-center">
                      <div>
                        <p className="font-medium">{req.title}</p>
                        <p className="text-sm text-gray-600">{req.category} • {req.status}</p>
                      </div>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">{req.urgency}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <TenantCommunication leaseId={leaseData.id} tenantEmail={email} />
        )}
      </div>
    </div>
  );
}