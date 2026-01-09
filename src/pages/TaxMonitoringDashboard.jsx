import React, { useState, useEffect } from 'react';
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
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

export default function TaxMonitoringDashboard() {
  const [country, setCountry] = useState('DE');
  const [refreshInterval, setRefreshInterval] = useState(60);

  const { data: monitoring = {} } = useQuery({
    queryKey: ['taxMonitoring', country],
    queryFn: async () => {
      const response = await base44.functions.invoke('getTaxMonitoringData', { country });
      return response.data || {};
    },
    refetchInterval: refreshInterval * 1000
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📊 Live-Steuerverfolgung</h1>
          <p className="text-slate-500 mt-1">Echtzeitüberwachung Ihrer Steuersituation</p>
        </div>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
            <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
            <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {monitoring.pending_alerts && monitoring.pending_alerts.length > 0 && (
        <div className="space-y-2">
          {monitoring.pending_alerts.map(alert => (
            <Card key={alert.id} className={
              alert.severity === 'critical' ? 'border-red-300 bg-red-50' :
              alert.severity === 'warning' ? 'border-orange-300 bg-orange-50' : 'border-blue-300 bg-blue-50'
            }>
              <CardContent className="pt-6 flex items-start gap-3">
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  alert.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{alert.type}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Aktive Filings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{monitoring.filings?.length || 0}</p>
            <p className="text-xs text-slate-600 mt-2">
              {monitoring.filings?.map(f => `${f.tax_year}: ${f.completion_percentage}%`).join(', ')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Bevorstehende Fristen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{monitoring.upcoming_deadlines?.length || 0}</p>
            {monitoring.upcoming_deadlines && monitoring.upcoming_deadlines[0] && (
              <p className="text-xs text-slate-600 mt-2">
                Nächste: {monitoring.upcoming_deadlines[0].title} in {monitoring.upcoming_deadlines[0].days_remaining} Tagen
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {monitoring.upcoming_deadlines && monitoring.upcoming_deadlines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📅 Termine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {monitoring.upcoming_deadlines.map(deadline => (
              <div key={deadline.id} className="p-3 bg-slate-50 rounded flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{deadline.title}</p>
                  <p className="text-xs text-slate-600">{new Date(deadline.deadline_date).toLocaleDateString('de-DE')}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  deadline.days_remaining <= 7 ? 'bg-red-100 text-red-700' :
                  deadline.days_remaining <= 14 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                }`}>
                  {deadline.days_remaining} Tage
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}