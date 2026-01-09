import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Brain, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  TrendingUp,
  Shield,
  FileSearch
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function LeaseContractAnalyzer({ contractId, contractText, onAnalysisComplete }) {
  const [analysis, setAnalysis] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('analyzeLeaseContract', {
        contract_id: contractId,
        contract_text: contractText
      });
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      toast.success('Vertrag erfolgreich analysiert');
      onAnalysisComplete?.(data.analysis);
    },
    onError: (error) => {
      toast.error('Analyse fehlgeschlagen: ' + error.message);
    }
  });

  const getRiskColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getImportanceColor = (importance) => {
    switch (importance) {
      case 'high': return 'bg-purple-600 text-white';
      case 'medium': return 'bg-blue-600 text-white';
      case 'low': return 'bg-slate-600 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {!analysis ? (
        <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="w-16 h-16 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              KI-Vertragsanalyse
            </h3>
            <p className="text-sm text-slate-600 mb-6 text-center max-w-md">
              Lassen Sie den Vertrag automatisch analysieren: Klauseln extrahieren, 
              Risiken identifizieren und Zusammenfassung erstellen
            </p>
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analysiere...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Vertrag analysieren
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <FileText className="w-5 h-5" />
                Zusammenfassung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-purple-900 mb-3">{analysis.summary?.overview}</p>
                {analysis.summary?.key_points && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-purple-900">Kernpunkte:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.summary.key_points.map((point, idx) => (
                        <li key={idx} className="text-sm text-purple-800">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 pt-3 border-t border-purple-200">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-900">
                    Compliance: {analysis.compliance_score}%
                  </span>
                </div>
                <Badge className="bg-purple-600 text-white">
                  {analysis.overall_assessment}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Sections */}
          <Accordion type="multiple" defaultValue={['clauses', 'risks']} className="space-y-4">
            {/* Key Clauses */}
            <AccordionItem value="clauses">
              <Card>
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <CardTitle className="flex items-center gap-2">
                    <FileSearch className="w-5 h-5 text-blue-600" />
                    Wichtige Klauseln ({analysis.key_clauses?.length || 0})
                  </CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-3 pt-0">
                    {analysis.key_clauses?.map((clause, idx) => (
                      <div key={idx} className="p-3 border border-slate-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-slate-900">{clause.category}</p>
                          <Badge className={getImportanceColor(clause.importance)}>
                            {clause.importance}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">{clause.clause}</p>
                        <p className="text-xs text-slate-600">{clause.details}</p>
                      </div>
                    ))}
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Risks */}
            <AccordionItem value="risks">
              <Card>
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Identifizierte Risiken ({analysis.risks?.length || 0})
                  </CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-3 pt-0">
                    {analysis.risks?.length === 0 ? (
                      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-sm text-green-800">Keine signifikanten Risiken gefunden</p>
                      </div>
                    ) : (
                      analysis.risks?.map((risk, idx) => (
                        <div key={idx} className={`p-4 border rounded-lg ${getRiskColor(risk.severity)}`}>
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-semibold">{risk.risk_type}</p>
                            <Badge variant="outline" className="border-current">
                              {risk.severity}
                            </Badge>
                          </div>
                          <p className="text-sm mb-3">{risk.description}</p>
                          <div className="p-3 bg-white bg-opacity-50 rounded">
                            <p className="text-xs font-semibold mb-1">Empfehlung:</p>
                            <p className="text-xs">{risk.recommendation}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Template Comparison */}
            {analysis.template_comparison && (
              <AccordionItem value="comparison">
                <Card>
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                      Abweichungen von Vorlage
                    </CardTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-4 pt-0">
                      <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        <span className="text-sm font-semibold text-indigo-900">
                          Abweichungsgrad: {analysis.template_comparison.deviation_score}%
                        </span>
                      </div>

                      {analysis.template_comparison.added_clauses?.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-slate-900 mb-2">Hinzugefügte Klauseln:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {analysis.template_comparison.added_clauses.map((clause, idx) => (
                              <li key={idx} className="text-sm text-green-700">{clause}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis.template_comparison.modified_clauses?.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-slate-900 mb-2">Geänderte Klauseln:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {analysis.template_comparison.modified_clauses.map((clause, idx) => (
                              <li key={idx} className="text-sm text-amber-700">{clause}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis.template_comparison.missing_clauses?.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-slate-900 mb-2">Fehlende Klauseln:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {analysis.template_comparison.missing_clauses.map((clause, idx) => (
                              <li key={idx} className="text-sm text-red-700">{clause}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            )}
          </Accordion>

          <Button
            variant="outline"
            onClick={() => {
              setAnalysis(null);
              analyzeMutation.reset();
            }}
            className="w-full"
          >
            Erneut analysieren
          </Button>
        </div>
      )}
    </div>
  );
}