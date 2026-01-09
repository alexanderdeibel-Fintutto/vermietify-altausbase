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
import { CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function ConsolidatedTaxSummary() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: summary = {}, isLoading } = useQuery({
    queryKey: ['taxSummary', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('consolidateTaxSummary', {
        country,
        taxYear
      });
      return response.data?.summary || {};
    }
  });

  const analysis = summary.analysis || {};

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const s = status.toLowerCase();
    if (s.includes('completed') || s.includes('filed')) return 'bg-green-100 text-green-800';
    if (s.includes('at risk') || s.includes('overdue')) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Konsolidierte Steuerzusammenfassung</h1>
        <p className="text-slate-500 mt-1">Gesamtübersicht Ihrer Steuersituation</p>
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
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Zusammenfassung wird erstellt...</div>
      ) : (
        <>
          {/* Executive Summary */}
          {analysis.executive_summary && (
            <Card className="border-2 border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">📋 Zusammenfassung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{analysis.executive_summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Geschätzte Steuerbelastung</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  €{Math.round(analysis.total_tax_liability || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Rückerstattung/Nachzahlung</p>
                <p className={`text-3xl font-bold mt-2 ${
                  (analysis.estimated_refund_or_liability || 0) < 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  €{Math.round(Math.abs(analysis.estimated_refund_or_liability || 0)).toLocaleString()}
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  {(analysis.estimated_refund_or_liability || 0) < 0 ? 'Rückerstattung' : 'Nachzahlung'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filing Status */}
          {analysis.filing_status && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Einreichungsstatus</span>
                  <Badge className={getStatusColor(analysis.filing_status)}>
                    {analysis.filing_status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compliance Status */}
          {analysis.compliance_status && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {analysis.compliance_status.toLowerCase().includes('compliant') ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium">Compliance-Status</span>
                  </div>
                  <span className="text-sm font-bold">{analysis.compliance_status}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Planning Items */}
          {(analysis.planning_items || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🎯 Planungs-Maßnahmen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.planning_items.map((item, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-slate-50 rounded">
                    <span className="text-blue-600 font-bold">→</span>
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Risk Assessment */}
          {analysis.risk_assessment && (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Risikobewertung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{analysis.risk_assessment}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Items */}
          {(analysis.action_items || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">✅ Aktionsplan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.action_items.map((action, i) => (
                  <div key={i} className="flex gap-3 p-2 bg-slate-50 rounded text-sm">
                    <span className="font-bold text-green-600 flex-shrink-0">{i + 1}.</span>
                    {action}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* File Count */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium">Erfasste Dokumente</span>
                </div>
                <span className="text-2xl font-bold">{summary.document_count || 0}</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}