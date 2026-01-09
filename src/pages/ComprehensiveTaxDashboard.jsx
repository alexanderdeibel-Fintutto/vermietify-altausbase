import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, CheckCircle2, AlertTriangle, Download } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function ComprehensiveTaxDashboard() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  // Fetch all tax data
  const { data: allData = {}, isLoading } = useQuery({
    queryKey: ['comprehensiveTaxData', country, taxYear],
    queryFn: async () => {
      const [filings, calculations, documents, compliance, alerts] = await Promise.all([
        base44.entities.TaxFiling.filter({ country, tax_year: taxYear }).catch(() => []),
        base44.entities.TaxCalculation.filter({ country, tax_year: taxYear }).catch(() => []),
        base44.entities.TaxDocument.filter({ country, tax_year: taxYear }).catch(() => []),
        base44.entities.TaxCompliance.filter({ country, tax_year: taxYear }).catch(() => []),
        base44.entities.TaxAlert.filter({ country }).catch(() => [])
      ]);

      return {
        filings,
        calculations,
        documents,
        compliance,
        alerts
      };
    }
  });

  const { filings = [], calculations = [], documents = [], compliance = [], alerts = [] } = allData;
  
  const totalTax = calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0);
  const filingStatus = filings.length > 0 ? filings[0].status : 'draft';
  const compliancePercentage = compliance.length > 0 
    ? (compliance.filter(c => c.status === 'completed').length / compliance.length * 100)
    : 0;
  const activeAlerts = alerts.filter(a => !a.is_resolved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📊 Steuer-Dashboard</h1>
          <p className="text-slate-500 mt-1">Vollständiger Überblick über Ihre Steuersituation</p>
        </div>
        <Button 
          onClick={() => base44.functions.invoke('generateAutomatedTaxReport', { country, taxYear })}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Bericht
        </Button>
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
              {[CURRENT_YEAR - 1, CURRENT_YEAR].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">⏳ Daten werden geladen...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Geschätzte Steuer</p>
                <p className="text-2xl font-bold text-red-600 mt-2">€{Math.round(totalTax).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className={
              filingStatus === 'completed' ? 'border-green-300 bg-green-50' :
              filingStatus === 'submitted' ? 'border-blue-300 bg-blue-50' :
              'border-yellow-300 bg-yellow-50'
            }>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Einreichungsstatus</p>
                <p className="text-lg font-bold mt-2 capitalize">{filingStatus.replace('_', ' ')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Dokumente</p>
                <p className="text-2xl font-bold mt-2">{documents.length}</p>
              </CardContent>
            </Card>
            <Card className={activeAlerts > 0 ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-600">Aktive Alerts</p>
                <p className={`text-2xl font-bold mt-2 ${activeAlerts > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {activeAlerts}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Compliance-Fortschritt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Gesamtfortschritt</span>
                  <span className="text-sm font-bold">{Math.round(compliancePercentage)}%</span>
                </div>
                <Progress value={compliancePercentage} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>{compliance.filter(c => c.status === 'completed').length} abgeschlossen</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span>{compliance.filter(c => c.status === 'in_progress').length} in Bearbeitung</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Filings */}
          {filings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Erklärungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filings.map(filing => (
                  <div key={filing.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <div>
                      <p className="text-sm font-medium">{filing.filing_type}</p>
                      <p className="text-xs text-slate-600">Jahr: {filing.tax_year}</p>
                    </div>
                    <Badge className={
                      filing.status === 'completed' ? 'bg-green-100 text-green-800' :
                      filing.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {filing.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Active Alerts */}
          {activeAlerts > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  Aktive Warnungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alerts.filter(a => !a.is_resolved).slice(0, 5).map(alert => (
                  <div key={alert.id} className="text-sm p-2 bg-white rounded">
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-xs text-slate-600">{alert.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}