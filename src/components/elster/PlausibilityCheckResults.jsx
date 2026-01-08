import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export default function PlausibilityCheckResults({ validation }) {
  if (!validation) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAssessmentBadge = (assessment) => {
    const config = {
      EXCELLENT: { variant: 'default', className: 'bg-green-500' },
      GOOD: { variant: 'default', className: 'bg-blue-500' },
      ACCEPTABLE: { variant: 'secondary', className: 'bg-yellow-500' },
      QUESTIONABLE: { variant: 'destructive', className: 'bg-orange-500' },
      CRITICAL: { variant: 'destructive' }
    };
    return config[assessment] || config.ACCEPTABLE;
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'HIGH': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'MEDIUM': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default: return <AlertCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Plausibilitätsprüfung</span>
          <Badge {...getAssessmentBadge(validation.overall_assessment)}>
            {validation.overall_assessment}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(validation.plausibility_score)}`}>
            {validation.plausibility_score}/100
          </div>
          <div className="text-sm text-slate-600 mt-1">Plausibilitäts-Score</div>
        </div>

        {/* Compliance Check */}
        {validation.compliance_check && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              {validation.compliance_check.all_required_fields ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : (
                <XCircle className="w-3 h-3 text-red-600" />
              )}
              <span>Pflichtfelder</span>
            </div>
            <div className="flex items-center gap-1">
              {validation.compliance_check.mathematical_consistency ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : (
                <XCircle className="w-3 h-3 text-red-600" />
              )}
              <span>Mathematik</span>
            </div>
            <div className="flex items-center gap-1">
              {validation.compliance_check.legal_requirements_met ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : (
                <XCircle className="w-3 h-3 text-red-600" />
              )}
              <span>Rechtl. Anforderungen</span>
            </div>
          </div>
        )}

        {/* Anomalies */}
        {validation.anomalies?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-sm">Auffälligkeiten</h4>
            <div className="space-y-2">
              {validation.anomalies.map((anomaly, idx) => (
                <Alert key={idx} variant="destructive" className="py-2">
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(anomaly.severity)}
                    <div className="flex-1">
                      <div className="font-medium text-xs">{anomaly.field}</div>
                      <AlertDescription className="text-xs mt-1">
                        {anomaly.issue}
                      </AlertDescription>
                      {anomaly.expected_range && (
                        <div className="text-xs text-slate-600 mt-1">
                          Erwartet: {anomaly.expected_range} | Ist: {anomaly.actual_value}
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {validation.suggestions?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-sm">Verbesserungsvorschläge</h4>
            <div className="space-y-2">
              {validation.suggestions.map((suggestion, idx) => (
                <div key={idx} className="p-2 bg-blue-50 rounded text-xs">
                  <div className="font-medium text-blue-900">{suggestion.category}</div>
                  <div className="text-blue-700 mt-1">{suggestion.suggestion}</div>
                  {suggestion.impact && (
                    <div className="text-blue-600 mt-1 italic">→ {suggestion.impact}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {validation.warnings?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-sm">Warnungen</h4>
            <div className="space-y-1">
              {validation.warnings.map((warning, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-3 h-3 text-yellow-600 mt-0.5" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}