import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxFilingTimeline() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: timeline = {}, isLoading } = useQuery({
    queryKey: ['taxFilingTimeline', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('createTaxFilingTimeline', {
        country,
        taxYear
      });
      return response.data?.timeline || {};
    }
  });

  const getPhaseColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-green-500 bg-green-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📅 Tax Filing Timeline</h1>
        <p className="text-slate-500 mt-1">Strukturierter Ablaufplan für Ihr Steuerjahr</p>
      </div>

      {/* Controls */}
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
              <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR + 1)}>{CURRENT_YEAR + 1}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Lade Timeline...</div>
      ) : (
        <>
          {/* Filing Phases */}
          {(timeline.schedule?.phases || []).length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold">📋 Phasen</h2>
              {timeline.schedule.phases.map((phase, idx) => (
                <Card key={idx} className={`border-l-4 ${getPhaseColor(phase.priority)}`}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{phase.phase}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {new Date(phase.start_date).toLocaleDateString('de-DE')} - {
                            new Date(phase.end_date).toLocaleDateString('de-DE')
                          }
                        </p>
                      </div>
                      {phase.priority && (
                        <Badge className="flex-shrink-0">
                          {phase.priority.toUpperCase()}
                        </Badge>
                      )}
                    </div>

                    {(phase.tasks || []).length > 0 && (
                      <ul className="space-y-1 text-sm">
                        {phase.tasks.map((task, i) => (
                          <li key={i} className="flex gap-2 text-slate-700">
                            <span className="text-slate-400">→</span> {task}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Critical Dates */}
          {(timeline.schedule?.critical_dates || []).length > 0 && (
            <Alert className="border-red-300 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900">
                <strong>🚨 Kritische Termine:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  {timeline.schedule.critical_dates.map((date, i) => (
                    <li key={i}>• {date}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Buffer Days */}
          {timeline.schedule?.buffer_days && (
            <Card className="border-blue-300 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">Puffer-Tage</p>
                    <p className="text-sm text-blue-800 mt-1">
                      Empfohlener Zeitpuffer: {timeline.schedule.buffer_days} Tage vor den Stichtagen
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contingencies */}
          {(timeline.schedule?.contingencies || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🛡️ Notfall-Pläne</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {timeline.schedule.contingencies.map((contingency, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-slate-50 rounded">
                    <span className="text-slate-400 flex-shrink-0">→</span>
                    {contingency}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card className="bg-slate-50">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-700">
                <strong>Insgesamt {timeline.deadlines_count} Fristen</strong> für {country} im Jahr {taxYear}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}