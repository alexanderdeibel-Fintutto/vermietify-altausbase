import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Info, TrendingDown, TrendingUp } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

export default function RiskAssessment({ submission }) {
  const calculateRisk = () => {
    let riskScore = 0;
    const risks = [];

    // Fehlende Daten
    if (!submission.form_data || Object.keys(submission.form_data).length < 5) {
      riskScore += 30;
      risks.push({
        severity: 'high',
        category: 'Datenqualität',
        message: 'Unvollständige Formulardaten',
        impact: 'Ablehnung wahrscheinlich'
      });
    }

    // Niedrige KI-Vertrauen
    if (submission.ai_confidence_score < 60) {
      riskScore += 25;
      risks.push({
        severity: 'high',
        category: 'Datengenauigkeit',
        message: 'Niedriges KI-Vertrauen',
        impact: 'Nachprüfung erforderlich'
      });
    }

    // Keine Validierung
    if (submission.status === 'DRAFT' || submission.status === 'AI_PROCESSED') {
      riskScore += 20;
      risks.push({
        severity: 'medium',
        category: 'Prozess',
        message: 'Noch nicht validiert',
        impact: 'Validierung vor Einreichung erforderlich'
      });
    }

    // Test-Modus
    if (submission.submission_mode === 'TEST') {
      riskScore += 15;
      risks.push({
        severity: 'medium',
        category: 'Konfiguration',
        message: 'Test-Modus aktiv',
        impact: 'Keine offizielle Übermittlung möglich'
      });
    }

    // Validierungsfehler
    if (submission.validation_errors?.length > 0) {
      riskScore += 40;
      risks.push({
        severity: 'critical',
        category: 'Validierung',
        message: `${submission.validation_errors.length} Validierungsfehler`,
        impact: 'Einreichung wird abgelehnt'
      });
    }

    // Außergewöhnliche Werte
    if (submission.form_data) {
      const income = submission.form_data.income_rent || 0;
      const expenses = submission.form_data.expense_total || 0;
      
      if (income > 0 && expenses > income * 1.5) {
        riskScore += 20;
        risks.push({
          severity: 'medium',
          category: 'Plausibilität',
          message: 'Ausgaben übersteigen Einnahmen deutlich',
          impact: 'Erhöhtes Prüfungsrisiko'
        });
      }
    }

    return {
      score: Math.min(riskScore, 100),
      level: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
      risks
    };
  };

  const assessment = calculateRisk();

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getRiskBg = (level) => {
    switch (level) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-green-50 border-green-200';
    }
  };

  const getRiskLabel = (level) => {
    switch (level) {
      case 'high': return 'Hohes Risiko';
      case 'medium': return 'Mittleres Risiko';
      default: return 'Niedriges Risiko';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Risikobewertung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`p-4 rounded-lg border ${getRiskBg(assessment.level)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`font-bold ${getRiskColor(assessment.level)}`}>
              {getRiskLabel(assessment.level)}
            </span>
            <Badge variant={assessment.level === 'low' ? 'default' : 'destructive'}>
              {assessment.score}/100
            </Badge>
          </div>
          <Progress 
            value={assessment.score} 
            className={`h-2 ${assessment.level === 'high' ? '[&>div]:bg-red-600' : assessment.level === 'medium' ? '[&>div]:bg-yellow-600' : '[&>div]:bg-green-600'}`}
          />
        </div>

        <div className="space-y-2">
          {assessment.risks.map((risk, idx) => (
            <Alert 
              key={idx} 
              className={
                risk.severity === 'critical' ? 'bg-red-50 border-red-300' :
                risk.severity === 'high' ? 'bg-red-50 border-red-200' :
                risk.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }
            >
              <AlertTriangle className={`h-4 w-4 ${
                risk.severity === 'critical' || risk.severity === 'high' ? 'text-red-600' :
                risk.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
              }`} />
              <AlertDescription>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{risk.message}</div>
                    <div className="text-xs text-slate-600 mt-1">{risk.category}</div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {risk.severity}
                  </Badge>
                </div>
                <div className="text-xs mt-2 p-2 bg-white rounded border">
                  ⚠️ {risk.impact}
                </div>
              </AlertDescription>
            </Alert>
          ))}

          {assessment.risks.length === 0 && (
            <Alert className="bg-green-50 border-green-200">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Keine erhöhten Risiken erkannt
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}