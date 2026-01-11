import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import WorkflowDashboard from '@/components/automation/WorkflowDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, MessageSquare } from 'lucide-react';

export default function WorkflowAutomationCenter() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: building } = useQuery({
    queryKey: ['building', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const buildings = await base44.asServiceRole.entities.Building.filter({
        created_by: user.email
      }, '-created_date', 1);
      return buildings[0];
    },
    enabled: !!user?.email
  });

  const companyId = building?.company_id || user?.company_id;

  if (!companyId) return <div className="text-center py-12">Lade Daten...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workflow-Automatisierung</h1>
        <p className="text-slate-600 mt-1">
          Automatische Mahnungen, Vertragsverlängerungen & Mietanpassungen
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Aktive Automatisierungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-green-50 rounded text-center">
              <p className="text-xs text-green-600 mb-1">Mahnungen</p>
              <p className="text-2xl font-bold text-green-900">✓</p>
              <p className="text-xs text-slate-600">Täglich 9:00</p>
            </div>
            <div className="p-3 bg-blue-50 rounded text-center">
              <p className="text-xs text-blue-600 mb-1">Verlängerungen</p>
              <p className="text-2xl font-bold text-blue-900">✓</p>
              <p className="text-xs text-slate-600">Monatlich</p>
            </div>
            <div className="p-3 bg-purple-50 rounded text-center">
              <p className="text-xs text-purple-600 mb-1">NK-Anpassung</p>
              <p className="text-2xl font-bold text-purple-900">✓</p>
              <p className="text-xs text-slate-600">Jährlich</p>
            </div>
            <div className="p-3 bg-orange-50 rounded text-center">
              <p className="text-xs text-orange-600 mb-1">Indexmiete</p>
              <p className="text-2xl font-bold text-orange-900">✓</p>
              <p className="text-xs text-slate-600">Jährlich</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <WorkflowDashboard companyId={companyId} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Vermieter-Assistent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-3">
            Senden Sie WhatsApp-Nachrichten für Quick-Actions:
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-slate-50 rounded">
              <p className="font-medium">• "Leerstand"</p>
              <p className="text-slate-600">→ Zeigt freie Einheiten</p>
            </div>
            <div className="p-2 bg-slate-50 rounded">
              <p className="font-medium">• "Zahlungen"</p>
              <p className="text-slate-600">→ Liste überfälliger Mieten</p>
            </div>
            <div className="p-2 bg-slate-50 rounded">
              <p className="font-medium">• "Wartung"</p>
              <p className="text-slate-600">→ Offene Wartungsaufgaben</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}