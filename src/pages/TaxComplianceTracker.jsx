import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxComplianceTracker() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: compliance = [], isLoading } = useQuery({
    queryKey: ['taxCompliance', country, taxYear],
    queryFn: async () => {
      try {
        const results = await base44.entities.TaxCompliance.filter({
          country,
          tax_year: taxYear
        });
        return results || [];
      } catch {
        return [];
      }
    }
  });

  const completedItems = compliance.filter(c => c.status === 'completed').length;
  const completionRate = compliance.length > 0 ? (completedItems / compliance.length * 100) : 0;

  const itemsByStatus = {
    completed: compliance.filter(c => c.status === 'completed'),
    in_progress: compliance.filter(c => c.status === 'in_progress'),
    pending: compliance.filter(c => c.status === 'pending'),
    at_risk: compliance.filter(c => c.status === 'at_risk'),
    overdue: compliance.filter(c => c.status === 'overdue')
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (status === 'at_risk' || status === 'overdue') return <AlertCircle className="w-4 h-4 text-red-600" />;
    return <Clock className="w-4 h-4 text-yellow-600" />;
  };

  const getStatusColor = (status) => {
    if (status === 'completed') return 'bg-green-50 border-green-300';
    if (status === 'at_risk' || status === 'overdue') return 'bg-red-50 border-red-300';
    if (status === 'in_progress') return 'bg-blue-50 border-blue-300';
    return 'bg-slate-50 border-slate-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">✓ Steuer-Compliance Tracker</h1>
        <p className="text-slate-500 mt-1">Überwachen Sie Ihre Compliance-Anforderungen</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
              <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
              <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Daten werden geladen...</div>
      ) : compliance.length > 0 ? (
        <>
          {/* Overall Progress */}
          <Card className="border-blue-300 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-sm">📊 Gesamtfortschritt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{completedItems} von {compliance.length} abgeschlossen</span>
                <span className={`text-lg font-bold ${
                  completionRate >= 80 ? 'text-green-600' :
                  completionRate >= 50 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {Math.round(completionRate)}%
                </span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </CardContent>
          </Card>

          {/* Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { status: 'completed', label: 'Abgeschlossen', color: 'text-green-600', bg: 'bg-green-50' },
              { status: 'in_progress', label: 'In Bearbeitung', color: 'text-blue-600', bg: 'bg-blue-50' },
              { status: 'pending', label: 'Ausstehend', color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { status: 'at_risk', label: 'Gefährdet', color: 'text-orange-600', bg: 'bg-orange-50' },
              { status: 'overdue', label: 'Überfällig', color: 'text-red-600', bg: 'bg-red-50' }
            ].map(({ status, label, color, bg }) => {
              const count = itemsByStatus[status]?.length || 0;
              return (
                <Card key={status} className={`${bg} border-none`}>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-slate-600">{label}</p>
                    <p className={`text-2xl font-bold mt-2 ${color}`}>{count}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Items by Status */}
          {Object.entries(itemsByStatus).map(([status, items]) => 
            items.length > 0 && (
              <Card key={status} className={`border-l-4 ${getStatusColor(status)}`}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(status)}
                    {status === 'completed' ? 'Abgeschlossen' :
                     status === 'in_progress' ? 'In Bearbeitung' :
                     status === 'at_risk' ? 'Gefährdet' :
                     status === 'overdue' ? 'Überfällig' :
                     'Ausstehend'} ({items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="p-3 bg-white rounded border text-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{item.requirement}</p>
                          <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                        </div>
                        <Badge className={`ml-2 flex-shrink-0 ${
                          item.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.priority}
                        </Badge>
                      </div>
                      {item.deadline && (
                        <p className="text-xs text-slate-600 mt-2">
                          📅 Deadline: {new Date(item.deadline).toLocaleDateString('de-DE')}
                        </p>
                      )}
                      {item.completion_percentage !== undefined && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Fortschritt</span>
                            <span className="font-bold">{item.completion_percentage}%</span>
                          </div>
                          <Progress value={item.completion_percentage} className="h-1" />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Keine Compliance-Anforderungen für dieses Jahr gefunden
        </div>
      )}
    </div>
  );
}