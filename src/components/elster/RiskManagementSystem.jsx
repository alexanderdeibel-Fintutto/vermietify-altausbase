import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

export default function RiskManagementSystem({ submissions }) {
  const risks = [
    {
      id: 'deadline',
      category: 'Fristen',
      level: 'low',
      description: 'Alle Fristen eingehalten',
      impact: 'Keine verspäteten Einreichungen',
      mitigation: 'Automatische Erinnerungen aktiv',
      probability: 10
    },
    {
      id: 'validation',
      category: 'Validierung',
      level: submissions.filter(s => s.validation_errors?.length > 0).length > 3 ? 'high' : 'medium',
      description: `${submissions.filter(s => s.validation_errors?.length > 0).length} Formulare mit Fehlern`,
      impact: 'Ablehnung durch ELSTER möglich',
      mitigation: 'Fehler vor Einreichung beheben',
      probability: 35
    },
    {
      id: 'compliance',
      category: 'Compliance',
      level: 'low',
      description: 'GoBD-Konformität gewährleistet',
      impact: 'Archivierung rechtskonform',
      mitigation: 'Automatische Backups täglich',
      probability: 5
    },
    {
      id: 'data_quality',
      category: 'Datenqualität',
      level: 'medium',
      description: 'Einige unvollständige Datensätze',
      impact: 'Ungenaue Steuerberechnung',
      mitigation: 'Daten-Validierung verstärken',
      probability: 25
    }
  ];

  const riskScore = risks.reduce((sum, r) => sum + r.probability, 0) / risks.length;
  const overallRisk = riskScore < 20 ? 'low' : riskScore < 40 ? 'medium' : 'high';

  const levelConfig = {
    low: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Niedrig', icon: CheckCircle },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Mittel', icon: AlertTriangle },
    high: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Hoch', icon: XCircle }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Risiko-Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Risk Score */}
        <div className={`p-4 border rounded-lg ${levelConfig[overallRisk].bg} ${levelConfig[overallRisk].border}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Gesamt-Risiko</span>
            <Badge className={levelConfig[overallRisk].bg}>
              {levelConfig[overallRisk].label}
            </Badge>
          </div>
          <Progress value={100 - riskScore} className="h-2" />
          <div className="text-xs text-slate-600 mt-2">
            Risiko-Score: {riskScore.toFixed(0)}/100
          </div>
        </div>

        {/* Risk Items */}
        <div className="space-y-2">
          {risks.map(risk => {
            const config = levelConfig[risk.level];
            const Icon = config.icon;

            return (
              <div key={risk.id} className={`p-3 border rounded-lg ${config.bg} ${config.border}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <div className="font-medium text-sm">{risk.category}</div>
                  </div>
                  <Badge className={config.bg} variant="outline">
                    {risk.probability}%
                  </Badge>
                </div>

                <div className="text-sm mb-2">{risk.description}</div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-600">Auswirkung:</span>
                    <div className="font-medium">{risk.impact}</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Maßnahme:</span>
                    <div className="font-medium">{risk.mitigation}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Items */}
        <div className="pt-4 border-t">
          <div className="text-sm font-medium mb-3">Empfohlene Maßnahmen</div>
          <div className="space-y-2">
            {risks.filter(r => r.level !== 'low').map(risk => (
              <Button
                key={risk.id}
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <TrendingUp className="w-3 h-3 mr-2" />
                {risk.mitigation}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}