import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageCircle, FileText, CheckCircle2, AlertTriangle, Share2, Download } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxAdvisorPortal() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR - 1);
  const [newComment, setNewComment] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const queryClient = useQueryClient();

  // Fetch shared portfolios (clients)
  const { data: sharedItems = [] } = useQuery({
    queryKey: ['sharedTaxItems', country, taxYear],
    queryFn: async () => {
      const user = await base44.auth.me();
      // In real implementation, this would fetch shared tax items
      return [];
    }
  });

  // Fetch alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ['taxAlerts', country, taxYear],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.TaxAlert.filter({
        user_email: user.email,
        country,
        tax_year: taxYear
      }) || [];
    }
  });

  // Fetch calculations for review
  const { data: calculations = [] } = useQuery({
    queryKey: ['calculations', country, taxYear],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.TaxCalculation.filter({
        country,
        tax_year: taxYear
      }) || [];
    }
  });

  // Add comment mutation
  const commentMutation = useMutation({
    mutationFn: async (comment) => {
      if (!selectedClient) return;
      // Implementation would depend on comment storage
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      setNewComment('');
    }
  });

  // Generate report
  const reportMutation = useMutation({
    mutationFn: async () => {
      const { data } = await base44.functions.invoke('generateTaxReport', {
        country,
        taxYear,
        reportType: 'advisor_summary'
      });
      return data;
    }
  });

  // Share functionality
  const shareMutation = useMutation({
    mutationFn: async () => {
      if (!shareEmail || !selectedClient) return;
      // Implementation would create share link
      return { success: true, shareUrl: 'https://example.com/share/...' };
    }
  });

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const completedCalculations = calculations.filter(c => c.status === 'filed' || c.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">👨‍💼 Tax Advisor Portal</h1>
        <p className="text-slate-500 mt-1">Verwalten Sie Mandanten & Steuererklärungen zentral</p>
      </div>

      {/* Country & Year Selection */}
      <div className="flex gap-4">
        <div className="flex-1 max-w-xs">
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

        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={taxYear.toString()} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" /> {criticalAlerts.length} kritische Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {criticalAlerts.map(alert => (
              <div key={alert.id} className="p-3 bg-white rounded border-l-4 border-red-500">
                <p className="font-semibold text-sm">{alert.title}</p>
                <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <p className="text-sm text-slate-600">Berechnungen</p>
            <p className="text-3xl font-bold">{calculations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-sm text-slate-600">Eingereicht</p>
            <p className="text-3xl font-bold text-green-600">{completedCalculations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-6 h-6 text-orange-600 mx-auto mb-1" />
            <p className="text-sm text-slate-600">Alerts</p>
            <p className="text-3xl font-bold text-orange-600">{alerts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <MessageCircle className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <p className="text-sm text-slate-600">Nachrichtenanzahl</p>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="calculations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculations">Berechnungen</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Aufgaben</TabsTrigger>
          <TabsTrigger value="documents">Dokumente & Reports</TabsTrigger>
        </TabsList>

        {/* Calculations Tab */}
        <TabsContent value="calculations" className="space-y-3">
          {calculations.map(calc => (
            <Card key={calc.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{calc.calculation_type}</h4>
                      <Badge className={
                        calc.status === 'filed' ? 'bg-green-100 text-green-800' :
                        calc.status === 'calculated' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }>
                        {calc.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      Gesamtsteuer: {calc.total_tax?.toLocaleString()} €/CHF
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Berechnet: {new Date(calc.calculated_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" /> Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map(alert => (
              <Card key={alert.id} className={alert.severity === 'critical' ? 'border-red-300' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{alert.title}</h4>
                        <Badge className={
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'warning' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{alert.message}</p>
                      {alert.related_deadline && (
                        <p className="text-xs text-slate-500 mt-1">
                          Deadline: {new Date(alert.related_deadline).toLocaleDateString('de-DE')}
                        </p>
                      )}
                    </div>

                    {alert.action_text && (
                      <Button variant="outline" size="sm" className="ml-2">
                        {alert.action_text}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="text-center py-8 text-slate-500">
              Keine Alerts für diese Periode
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-3">
          <Card className="border-blue-300 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" /> Report generieren
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => reportMutation.mutate()}
                className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
              >
                📄 Steuerbericht generieren
              </Button>
            </CardContent>
          </Card>

          <Card className="border-purple-300 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" /> Mit Mandant teilen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Email der zu teilenden Person"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
              <Button
                onClick={() => shareMutation.mutate()}
                className="w-full gap-2"
              >
                <Share2 className="w-4 h-4" /> Teilen
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" /> Interne Notizen & Kommentare
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Notizen für zukünftige Referenz..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button onClick={() => commentMutation.mutate(newComment)} className="gap-2">
            <MessageCircle className="w-4 h-4" /> Kommentar hinzufügen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}