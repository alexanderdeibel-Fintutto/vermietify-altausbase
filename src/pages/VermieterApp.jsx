import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, Euro, Wrench, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function VermieterApp() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['active-contracts'],
    queryFn: () => base44.entities.LeaseContract.filter({ status: 'active' })
  });

  const quickLinks = [
    { title: 'Gebäude', icon: Building2, path: 'Buildings', count: buildings.length, color: 'bg-blue-500' },
    { title: 'Mieter', icon: Users, path: 'Tenants', count: tenants.length, color: 'bg-green-500' },
    { title: 'Verträge', icon: FileText, path: 'Contracts', count: contracts.length, color: 'bg-purple-500' },
    { title: 'Finanzen', icon: Euro, path: 'Finanzen', color: 'bg-yellow-500' },
    { title: 'Wartung', icon: Wrench, path: 'MaintenanceTasks', color: 'bg-orange-500' },
    { title: 'Berichte', icon: TrendingUp, path: 'ReportsPage', color: 'bg-indigo-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Vermieter App</h1>
          <p className="text-slate-600">Willkommen zurück, {user?.full_name || 'Admin'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickLinks.map((link) => (
            <Link key={link.title} to={createPageUrl(link.path)}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${link.color} rounded-lg flex items-center justify-center`}>
                      <link.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{link.title}</CardTitle>
                      {link.count !== undefined && (
                        <p className="text-2xl font-bold text-slate-900">{link.count}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Schnellzugriff Funktionen</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to={createPageUrl('DocumentManagement')}>
              <div className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <h3 className="font-semibold">Dokumentenverwaltung</h3>
                <p className="text-sm text-slate-600">Verträge, Protokolle und mehr</p>
              </div>
            </Link>
            <Link to={createPageUrl('TenantCommunicationCenter')}>
              <div className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <h3 className="font-semibold">Mieterkommunikation</h3>
                <p className="text-sm text-slate-600">Nachrichten und Ankündigungen</p>
              </div>
            </Link>
            <Link to={createPageUrl('OperatingCosts')}>
              <div className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <h3 className="font-semibold">Nebenkostenabrechnung</h3>
                <p className="text-sm text-slate-600">Erstellen und verwalten</p>
              </div>
            </Link>
            <Link to={createPageUrl('PropertyManagerDashboard')}>
              <div className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <h3 className="font-semibold">Hausverwaltung Dashboard</h3>
                <p className="text-sm text-slate-600">Übersicht und KPIs</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}