import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, Users, Calculator, Wallet, FileText, 
  Gauge, Wrench, TrendingUp, Settings, Globe 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function VollversionApp() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const modules = [
    {
      category: 'Immobilienverwaltung',
      items: [
        { title: 'Vermieter App', icon: Building2, path: 'VermieterApp', color: 'bg-blue-600' },
        { title: 'Vermieter Go', icon: Users, path: 'VermieterGoApp', color: 'bg-green-600' },
        { title: 'Gebäude', icon: Building2, path: 'Buildings', color: 'bg-purple-600' },
        { title: 'Mieter', icon: Users, path: 'Tenants', color: 'bg-indigo-600' }
      ]
    },
    {
      category: 'Finanzen & Steuern',
      items: [
        { title: 'Haushaltsbuch', icon: Wallet, path: 'HaushaltsbuchbudgetApp', color: 'bg-emerald-600' },
        { title: 'Steuern', icon: Calculator, path: 'SteuerApp', color: 'bg-blue-700' },
        { title: 'Finanzen', icon: TrendingUp, path: 'Finanzen', color: 'bg-orange-600' },
        { title: 'Buchhaltung', icon: FileText, path: 'BankAccounts', color: 'bg-red-600' }
      ]
    },
    {
      category: 'Verwaltung & Service',
      items: [
        { title: 'Zähler', icon: Gauge, path: 'MeterApp', color: 'bg-cyan-600' },
        { title: 'Wartung', icon: Wrench, path: 'MaintenanceTasks', color: 'bg-yellow-600' },
        { title: 'Dokumente', icon: FileText, path: 'Documents', color: 'bg-pink-600' },
        { title: 'Einstellungen', icon: Settings, path: 'UserSettings', color: 'bg-slate-600' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <Globe className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">FinX Vollversion</h1>
          <p className="text-purple-200 text-lg">Komplette Business Suite für Immobilien, Finanzen & Steuern</p>
          <p className="text-purple-300 mt-2">Willkommen, {user?.full_name || 'Admin'}</p>
        </div>

        {modules.map((module) => (
          <div key={module.category} className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <div className="w-1 h-8 bg-purple-500 rounded"></div>
              {module.category}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {module.items.map((item) => (
                <Link key={item.title} to={createPageUrl(item.path)}>
                  <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all cursor-pointer h-full hover:scale-105 hover:shadow-2xl">
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 ${item.color} rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                        <item.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-bold text-white text-base">{item.title}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 mt-12">
          <CardHeader>
            <CardTitle className="text-white text-xl">Schnellzugriff</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <div className="p-4 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors">
                <h3 className="font-semibold text-white">Dashboard</h3>
                <p className="text-sm text-purple-100">Gesamtübersicht</p>
              </div>
            </Link>
            <Link to={createPageUrl('ReportsPage')}>
              <div className="p-4 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors">
                <h3 className="font-semibold text-white">Berichte</h3>
                <p className="text-sm text-purple-100">Analysen & Reports</p>
              </div>
            </Link>
            <Link to={createPageUrl('AdminDashboard')}>
              <div className="p-4 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors">
                <h3 className="font-semibold text-white">Administration</h3>
                <p className="text-sm text-purple-100">System verwalten</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}