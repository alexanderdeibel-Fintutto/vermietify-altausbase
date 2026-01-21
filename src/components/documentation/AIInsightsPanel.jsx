import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { 
  Lightbulb, 
  AlertTriangle, 
  TrendingUp, 
  Loader2,
  Shield,
  XCircle,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function AIInsightsPanel({ documentation }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeInsights = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('analyzeDocumentationInsights', {
        markdownContent: documentation.content_markdown,
        documentationType: documentation.documentation_type
      });

      setInsights(response.data.insights);
      toast.success('KI-Analyse abgeschlossen');
    } catch (error) {
      toast.error('Fehler bei KI-Analyse: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'HIGH': return 'bg-red-100 text-red-700 border-red-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'LOW': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'HIGH': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'MEDIUM': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'LOW': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            KI-Insights & Anomalien
          </CardTitle>
          <Button
            size="sm"
            onClick={analyzeInsights}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Analysiere...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                Analysieren
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      {insights && (
        <CardContent className="space-y-6">
          {/* Risk Level */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Risiko-Level:</span>
            <Badge className={getRiskColor(insights.risk_level)}>
              {insights.risk_level}
            </Badge>
          </div>

          {/* Key Insights */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              Wichtigste Erkenntnisse
            </h3>
            <ul className="space-y-2">
              {insights.key_insights?.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Potential Issues */}
          {insights.potential_issues && insights.potential_issues.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Potenzielle Probleme
              </h3>
              <div className="space-y-3">
                {insights.potential_issues.map((issue, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3">
                    <div className="flex items-start gap-2 mb-2">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <p className="font-medium text-sm text-slate-900">{issue.issue}</p>
                        <Badge className={`mt-1 ${getRiskColor(issue.severity)}`} size="sm">
                          {issue.severity}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 ml-6 mt-1">
                      💡 {issue.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimization Suggestions */}
          {insights.optimization_suggestions && insights.optimization_suggestions.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Optimierungsvorschläge
              </h3>
              <ul className="space-y-2">
                {insights.optimization_suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confidence Score */}
          {insights.confidence_score && (
            <div className="pt-4 border-t border-purple-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">KI-Konfidenz:</span>
                <span className="font-semibold text-purple-700">
                  {(insights.confidence_score * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}