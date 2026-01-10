import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Home, AlertCircle, CreditCard, CheckCircle } from 'lucide-react';

const templates = [
  {
    id: 'monthly-financial',
    name: 'Monatliche Finanzübersicht',
    description: 'Einnahmen, Ausgaben und Bilanz für den ausgewählten Monat',
    icon: CreditCard,
    entity: 'FinancialItem',
    metrics: ['total_income', 'total_expenses', 'net_profit'],
    period: 'monthly',
    color: 'bg-green-100'
  },
  {
    id: 'occupancy-trends',
    name: 'Belegungstrends',
    description: 'Vermietungsquoten und Leerstandsanalyse über Zeit',
    icon: Home,
    entity: 'Unit',
    metrics: ['occupancy_rate', 'vacancy_rate', 'units_total'],
    period: 'monthly',
    color: 'bg-blue-100'
  },
  {
    id: 'tenant-overview',
    name: 'Mieterverwaltung',
    description: 'Aktive Mieter, Verträge und Kommunikationsstatistiken',
    icon: Users,
    entity: 'Tenant',
    metrics: ['active_tenants', 'contracts_count', 'avg_rent'],
    period: 'current',
    color: 'bg-purple-100'
  },
  {
    id: 'overdue-tasks',
    name: 'Überfällige Aufgaben',
    description: 'Aufgaben, die ihre Fälligkeitsdaten überschritten haben',
    icon: AlertCircle,
    entity: 'BuildingTask',
    metrics: ['overdue_count', 'in_progress', 'by_priority'],
    period: 'current',
    color: 'bg-red-100'
  },
  {
    id: 'payment-analysis',
    name: 'Zahlungsanalyse',
    description: 'Zahlungsverhalten, Ausstände und Zahlungstrends',
    icon: CreditCard,
    entity: 'Payment',
    metrics: ['total_paid', 'outstanding', 'avg_payment_time'],
    period: 'monthly',
    color: 'bg-yellow-100'
  },
  {
    id: 'performance-kpi',
    name: 'Performance KPIs',
    description: 'Schlüsselindikatoren für Gebäude- und Vermögensverwaltung',
    icon: TrendingUp,
    entity: 'Building',
    metrics: ['roi', 'maintenance_cost_ratio', 'tenant_satisfaction'],
    period: 'yearly',
    color: 'bg-indigo-100'
  }
];

export default function ReportTemplates({ onSelectTemplate, isLoading }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Vordefinierte Berichtsvorlagen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${template.color} w-fit`}>
                      <Icon className="w-6 h-6 text-slate-700" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {template.period === 'monthly' ? 'Monatlich' : template.period === 'yearly' ? 'Jährlich' : 'Aktuell'}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{template.name}</CardTitle>
                  <CardDescription className="text-sm">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-2">Enthaltene Metriken:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.metrics.map((metric) => (
                          <Badge key={metric} variant="secondary" className="text-xs">
                            {metric.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={() => onSelectTemplate(template)}
                      disabled={isLoading}
                    >
                      Bericht generieren
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}