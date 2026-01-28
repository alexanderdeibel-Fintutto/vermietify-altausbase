import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { supabase } from '@/components/services/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Calendar, TrendingUp, Building2, Users } from 'lucide-react';
import QuickActionsMenu from '@/components/operating-costs/QuickActionsMenu';
import RecentStatementsWidget from '@/components/operating-costs/RecentStatementsWidget';
import CrossSellBanner from '@/components/shared/CrossSellBanner';
import TenantOverviewWidget from '@/components/tenant-portal/TenantOverviewWidget';

export default function Dashboard() {
  const { data: statements = [] } = useQuery({
    queryKey: ['operatingCostStatements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_operating_cost_summary')
        .select('*')
        .order('created_date', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    }
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_buildings_summary')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const drafts = statements.filter(s => s.status === 'Entwurf');
  const completed = statements.filter(s => s.status === 'Versendet');
  const thisYear = new Date().getFullYear();
  const thisYearStatements = statements.filter(s => s.abrechnungsjahr === thisYear);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Übersicht Ihrer Nebenkostenabrechnungen</p>
        </div>
        <Link to={createPageUrl('OperatingCostWizard')}>
          <Button size="lg" className="bg-gradient-to-r from-blue-900 to-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Neue Abrechnung
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">{statements.length}</span>
            </div>
            <p className="text-sm text-gray-600">Abrechnungen gesamt</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span className="text-2xl font-bold">{thisYearStatements.length}</span>
            </div>
            <p className="text-sm text-gray-600">Abrechnungen {thisYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold">{completed.length}</span>
            </div>
            <p className="text-sm text-gray-600">Versendet</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold">{buildings.length}</span>
            </div>
            <p className="text-sm text-gray-600">Objekte</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Statements */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Letzte Abrechnungen</CardTitle>
            <Link to={createPageUrl('OperatingCosts')}>
              <Button variant="outline" size="sm">Alle anzeigen</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {statements.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Noch keine Abrechnungen erstellt</p>
              <Link to={createPageUrl('OperatingCostWizard')}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Erste Abrechnung erstellen
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {statements.slice(0, 5).map(statement => (
                <Link 
                  key={statement.id} 
                  to={createPageUrl('OperatingCosts')}
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Abrechnung {statement.abrechnungsjahr}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(statement.zeitraum_von).toLocaleDateString('de-DE')} - 
                          {new Date(statement.zeitraum_bis).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statement.status === 'Entwurf' ? 'bg-yellow-100 text-yellow-700' :
                        statement.status === 'Versendet' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {statement.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions & Tenant Portal */}
      <div className="grid md:grid-cols-2 gap-6">
        <QuickActionsMenu />
        <TenantPortalDashboardWidget />
      </div>

      {/* Recent Statements Widget */}
      <RecentStatementsWidget limit={5} />

      {/* Mieterportal Widget */}
      <TenantOverviewWidget />

      <CrossSellBanner />

      {/* Drafts Section */}
      {drafts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-600" />
              Entwürfe fortsetzen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {drafts.map(draft => (
                <Link
                  key={draft.id}
                  to={createPageUrl('OperatingCostWizard', { id: draft.id })}
                  className="block p-4 border border-yellow-200 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Entwurf {draft.abrechnungsjahr}</p>
                      <p className="text-sm text-gray-600">
                        Zuletzt bearbeitet: {new Date(draft.updated_date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">Fortsetzen</Button>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}