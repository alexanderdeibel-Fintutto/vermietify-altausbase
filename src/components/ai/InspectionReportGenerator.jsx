import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InspectionReportGenerator({ unitId, buildingId }) {
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [findings, setFindings] = useState('');
  const [report, setReport] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!findings.trim()) {
      toast.error('Bitte Befunde eingeben');
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateInspectionReport', {
        buildingId,
        unitId,
        findings: findings
      });

      setReport(response.data.report);
      setShowForm(false);
      setFindings('');
      toast.success('Inspektionsbericht generiert');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      KRITISCH: 'bg-red-100 text-red-900 border-red-300',
      SCHWERWIEGEND: 'bg-orange-100 text-orange-900 border-orange-300',
      MODERAT: 'bg-yellow-100 text-yellow-900 border-yellow-300',
      GERING: 'bg-blue-100 text-blue-900 border-blue-300'
    };
    return colors[severity] || 'bg-gray-100 text-gray-900';
  };

  const getConditionIcon = (condition) => {
    if (condition === 'GUT') return <CheckCircle2 className="w-6 h-6 text-green-600" />;
    if (condition === 'BEFRIEDIGEND') return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
    return <AlertTriangle className="w-6 h-6 text-red-600" />;
  };

  return (
    <div className="space-y-4">
      {!report ? (
        <>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant="outline"
            className="w-full"
          >
            {showForm ? 'Abbrechen' : '+ Inspektionsbericht'}
          </Button>

          {showForm && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <form onSubmit={handleGenerate} className="space-y-4">
                  <textarea
                    placeholder="Beschreiben Sie Ihre Inspektionsfunde..."
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm h-24"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={generating}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generiere Bericht...
                      </>
                    ) : (
                      'Bericht generieren'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardHeader className="bg-slate-50">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{report.title}</CardTitle>
                <p className="text-sm text-slate-600 mt-1">{report.date}</p>
              </div>
              <div className="flex items-center gap-2">
                {getConditionIcon(report.overall_condition)}
                <span className="font-bold text-sm">{report.overall_condition}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Summary */}
            <div>
              <p className="text-sm text-slate-600">Zusammenfassung</p>
              <p className="text-sm mt-2">{report.summary}</p>
            </div>

            {/* Findings */}
            <div>
              <p className="font-bold text-slate-900 mb-3">Befunde</p>
              <div className="space-y-3">
                {report.findings.map((finding, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-3 ${getSeverityColor(finding.severity)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-sm">{finding.category}</h4>
                      <span className="text-xs font-medium">{finding.severity}</span>
                    </div>
                    <p className="text-sm mb-2">{finding.description}</p>
                    <div className="space-y-1 text-xs">
                      <p><strong>Empfehlung:</strong> {finding.recommendation}</p>
                      <p><strong>Geschätzte Kosten:</strong> {finding.estimated_cost}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {report.notes && (
              <div>
                <p className="text-sm text-slate-600">Notizen</p>
                <p className="text-sm mt-2">{report.notes}</p>
              </div>
            )}

            {/* Next Inspection */}
            <div className="bg-slate-50 rounded-lg p-3 text-sm">
              <p className="text-slate-600">Nächste Inspektion empfohlen:</p>
              <p className="font-bold">{new Date(report.next_inspection).toLocaleDateString('de-DE')}</p>
            </div>

            <Button
              onClick={() => setReport(null)}
              variant="outline"
              className="w-full"
            >
              Neuer Bericht
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}