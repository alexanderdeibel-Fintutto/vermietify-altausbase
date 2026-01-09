import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxCalendarAndTimeline() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: deadlines = [], isLoading } = useQuery({
    queryKey: ['taxDeadlines', country, taxYear],
    queryFn: async () => {
      const allDeadlines = await base44.entities.TaxDeadline.filter({
        country,
        tax_year: taxYear
      }).catch(() => []);
      return allDeadlines.sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date));
    }
  });

  const sortedDeadlines = [...deadlines].sort((a, b) => {
    const aDays = Math.ceil((new Date(a.deadline_date) - new Date()) / (1000 * 60 * 60 * 24));
    const bDays = Math.ceil((new Date(b.deadline_date) - new Date()) / (1000 * 60 * 60 * 24));
    return aDays - bDays;
  });

  const getStatusIcon = (deadline) => {
    const daysLeft = Math.ceil((new Date(deadline.deadline_date) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { icon: AlertTriangle, color: 'text-red-600', label: 'Überfällig' };
    if (daysLeft < 7) return { icon: AlertTriangle, color: 'text-orange-600', label: 'Dringend' };
    if (daysLeft < 30) return { icon: Clock, color: 'text-yellow-600', label: 'Bald fällig' };
    return { icon: CheckCircle2, color: 'text-green-600', label: 'Planbar' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📅 Steuer-Kalender & Timeline</h1>
        <p className="text-slate-500 mt-1">Alle wichtigen Termine auf einen Blick</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div className="flex items-end">
          <p className="text-sm text-slate-600">{sortedDeadlines.length} Termine</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Termine werden geladen...</div>
      ) : sortedDeadlines.length > 0 ? (
        <div className="space-y-3">
          {sortedDeadlines.map((deadline, i) => {
            const status = getStatusIcon(deadline);
            const StatusIcon = status.icon;
            const daysLeft = Math.ceil((new Date(deadline.deadline_date) - new Date()) / (1000 * 60 * 60 * 24));
            const deadlineDate = new Date(deadline.deadline_date);

            return (
              <Card key={i} className={
                daysLeft < 0 ? 'border-red-300 bg-red-50' :
                daysLeft < 7 ? 'border-orange-300 bg-orange-50' :
                daysLeft < 30 ? 'border-yellow-300 bg-yellow-50' : ''
              }>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <StatusIcon className={`w-6 h-6 flex-shrink-0 ${status.color}`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold">{deadline.title}</h3>
                        <span className="text-xs px-2 py-1 bg-slate-200 rounded">{status.label}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{deadline.description}</p>
                      <div className="flex gap-4 text-xs text-slate-600">
                        <span>📅 {deadlineDate.toLocaleDateString('de-DE')}</span>
                        <span>⏱️ {daysLeft < 0 ? `${Math.abs(daysLeft)} Tage überfällig` : `${daysLeft} Tage verbleibend`}</span>
                        <span>🏷️ {deadline.deadline_type}</span>
                      </div>
                      {deadline.priority && (
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            deadline.priority === 'critical' ? 'bg-red-200 text-red-800' :
                            deadline.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            Priorität: {deadline.priority}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Alert>
          <Calendar className="h-4 w-4" />
          <span>Keine Termine für {country} im Jahr {taxYear} verfügbar</span>
        </Alert>
      )}
    </div>
  );
}