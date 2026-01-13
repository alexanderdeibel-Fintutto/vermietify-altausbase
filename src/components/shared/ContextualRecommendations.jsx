import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ContextualRecommendations({ buildingId, type = 'optimization' }) {
  const [recommendations, setRecommendations] = useState([]);

  const { data: metrics } = useQuery({
    queryKey: ['building-metrics', buildingId],
    queryFn: async () => {
      const building = await base44.entities.Building.filter({ id: buildingId }).then(r => r[0]);
      const units = await base44.entities.Unit.filter({ building_id: buildingId });
      const contracts = await base44.entities.LeaseContract.filter({});
      const invoices = await base44.entities.Invoice.filter({ building_id: buildingId });
      
      return {
        building,
        units,
        contracts,
        invoices
      };
    },
    enabled: !!buildingId
  });

  useEffect(() => {
    if (!metrics) return;

    const recs = [];

    // Vacancy recommendations
    const totalUnits = metrics.units.length;
    const occupiedUnits = metrics.contracts.filter(
      c => new Date(c.start_date) <= new Date() && 
           (!c.end_date || new Date(c.end_date) >= new Date())
    ).length;
    const vacancyRate = totalUnits > 0 ? (1 - occupiedUnits / totalUnits) * 100 : 0;

    if (vacancyRate > 20) {
      recs.push({
        id: 'vacancy-high',
        title: 'Hohe Leerstandsquote',
        description: `${vacancyRate.toFixed(1)}% der Einheiten sind leer`,
        action: 'Zu Einheiten',
        impact: 'high',
        potential: '€ Mieteinnahmen'
      });
    }

    // Invoice aging recommendations
    const overdueDays = 45;
    const overdueInvoices = metrics.invoices.filter(inv => {
      const daysOverdue = (new Date() - new Date(inv.due_date)) / (1000 * 60 * 60 * 24);
      return daysOverdue > overdueDays && inv.status === 'pending';
    });

    if (overdueInvoices.length > 0) {
      recs.push({
        id: 'overdue-invoices',
        title: 'Ausstehende Zahlungen',
        description: `${overdueInvoices.length} Rechnungen sind über ${overdueDays} Tage überfällig`,
        action: 'Zu Rechnungen',
        impact: 'high',
        potential: `€ ${overdueInvoices.reduce((sum, i) => sum + (i.amount || 0), 0).toFixed(2)}`
      });
    }

    // Cost optimization recommendations
    if (metrics.building && metrics.building.total_operating_costs) {
      const avgCostPerUnit = metrics.building.total_operating_costs / totalUnits;
      recs.push({
        id: 'cost-analysis',
        title: 'Betriebskosten analysieren',
        description: `Durchschnitt: €${avgCostPerUnit.toFixed(2)}/Einheit/Monat`,
        action: 'Zu Analyse',
        impact: 'medium',
        potential: '5-10% Einsparungen'
      });
    }

    // Contract renewal planning
    const upcoming90Days = metrics.contracts.filter(c => {
      if (!c.end_date) return false;
      const daysUntil = (new Date(c.end_date) - new Date()) / (1000 * 60 * 60 * 24);
      return daysUntil > 0 && daysUntil < 90;
    });

    if (upcoming90Days.length > 0) {
      recs.push({
        id: 'renewal-planning',
        title: 'Verträge zur Verlängerung fällig',
        description: `${upcoming90Days.length} Verträge enden in den nächsten 90 Tagen`,
        action: 'Zu Verträgen',
        impact: 'medium',
        potential: 'Mieterhöhung möglich'
      });
    }

    setRecommendations(recs.slice(0, 4));
  }, [metrics]);

  if (recommendations.length === 0) {
    return null;
  }

  const getImpactColor = (impact) => {
    if (impact === 'high') return 'bg-red-100 text-red-800';
    if (impact === 'medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h4 className="font-semibold mb-4 text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          AI-Empfehlungen
        </h4>

        <div className="space-y-3">
          {recommendations.map(rec => (
            <div key={rec.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-medium text-sm text-slate-900">{rec.title}</p>
                <Badge className={`text-xs flex-shrink-0 ${getImpactColor(rec.impact)}`}>
                  {rec.impact}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 mb-2">{rec.description}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-700">
                  <Zap className="w-3 h-3 inline mr-1" />
                  {rec.potential}
                </span>
                <Button size="sm" variant="outline" className="text-xs h-7">
                  {rec.action}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}