import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Clock, FileText } from 'lucide-react';

export default function TaxComplianceDashboard() {
  const [selectedCountry, setSelectedCountry] = useState('DE');
  const [taxYear] = useState(new Date().getFullYear() - 1);

  const { data: compliance } = useQuery({
    queryKey: ['taxCompliance', selectedCountry, taxYear],
    queryFn: async () => {
      const items = await base44.entities.TaxCompliance.filter({
        country: selectedCountry,
        tax_year: taxYear
      }, '-priority');
      return items;
    }
  });

  const { data: alerts } = useQuery({
    queryKey: ['taxAlerts', selectedCountry],
    queryFn: async () => {
      const items = await base44.entities.TaxAlert.filter({
        country: selectedCountry,
        is_resolved: false
      }, '-priority');
      return items;
    }
  });

  const getSeverityColor = (severity) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity] || colors.warning;
  };

  const getCompletionPercentage = (items) => {
    if (!items?.length) return 0;
    const completed = items.filter(i => i.status === 'completed').length;
    return Math.round((completed / items.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light">Tax Compliance Dashboard</h1>
        <p className="text-slate-500 font-light mt-2">Übersicht aller Compliance-Anforderungen für {taxYear}</p>
      </div>

      {/* Country Selector */}
      <div className="flex gap-2">
        {['DE', 'CH', 'AT'].map(country => (
          <button
            key={country}
            onClick={() => setSelectedCountry(country)}
            className={`px-4 py-2 rounded-lg text-sm font-light transition-colors ${
              selectedCountry === country
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {country}
          </button>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({alerts?.length || 0})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Completion Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Compliance Readiness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-light text-sm">Gesamtfortschritt</span>
                  <span className="font-light text-lg">{getCompletionPercentage(compliance)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${getCompletionPercentage(compliance)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Items */}
          <div className="grid gap-3">
            {compliance?.map((item) => (
              <Card key={item.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-light text-sm">{item.requirement}</p>
                        <Badge className={`text-xs font-light ${
                          item.status === 'completed' ? 'bg-green-100 text-green-800' :
                          item.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-light mt-1">
                        {item.deadline && `Deadline: ${new Date(item.deadline).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-light">{item.completion_percentage}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts?.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-light text-sm">Keine offenen Alerts</p>
              </CardContent>
            </Card>
          ) : (
            alerts?.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="pt-4">
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-light text-sm">{alert.title}</p>
                      <p className="text-xs text-slate-600 font-light mt-1">{alert.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Wichtige Fristen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {compliance?.filter(c => c.deadline)
                  .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                  .map((item) => (
                    <div key={item.id} className="flex items-center gap-3 pb-3 border-b last:border-b-0 last:pb-0">
                      <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-light text-sm">{item.requirement}</p>
                        <p className="text-xs text-slate-500 font-light">
                          {new Date(item.deadline).toLocaleDateString('de-DE', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <Badge className="font-light text-xs">{item.priority}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}