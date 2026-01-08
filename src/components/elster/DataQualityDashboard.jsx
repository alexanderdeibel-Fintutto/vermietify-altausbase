import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Database, CheckCircle, AlertTriangle, Info,
  TrendingUp, FileText, Users, Calendar
} from 'lucide-react';

export default function DataQualityDashboard({ submissions }) {
  const calculateQualityMetrics = () => {
    const total = submissions.length;
    if (total === 0) return null;

    const withAI = submissions.filter(s => s.ai_confidence_score).length;
    const avgConfidence = withAI > 0 
      ? submissions.reduce((sum, s) => sum + (s.ai_confidence_score || 0), 0) / withAI
      : 0;

    const complete = submissions.filter(s => 
      s.form_data && Object.keys(s.form_data).length > 5
    ).length;

    const validated = submissions.filter(s => 
      s.status === 'VALIDATED' || s.status === 'SUBMITTED' || s.status === 'ACCEPTED'
    ).length;

    const withErrors = submissions.filter(s => 
      s.validation_errors && s.validation_errors.length > 0
    ).length;

    const recentUpdates = submissions.filter(s => {
      const daysSinceUpdate = (Date.now() - new Date(s.updated_date).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate <= 7;
    }).length;

    return {
      completeness: (complete / total) * 100,
      validation_rate: (validated / total) * 100,
      ai_confidence: avgConfidence,
      error_rate: (withErrors / total) * 100,
      freshness: (recentUpdates / total) * 100
    };
  };

  const metrics = calculateQualityMetrics();

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Database className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p className="text-slate-500">Keine Daten verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  const qualityChecks = [
    {
      id: 'completeness',
      name: 'Vollständigkeit',
      description: 'Ausgefüllte Felder',
      icon: FileText,
      score: metrics.completeness,
      target: 90
    },
    {
      id: 'validation',
      name: 'Validierungsrate',
      description: 'Validierte Formulare',
      icon: CheckCircle,
      score: metrics.validation_rate,
      target: 95
    },
    {
      id: 'ai_quality',
      name: 'KI-Qualität',
      description: 'Durchschnittliche Konfidenz',
      icon: TrendingUp,
      score: metrics.ai_confidence,
      target: 85
    },
    {
      id: 'accuracy',
      name: 'Fehlerfreiheit',
      description: 'Formulare ohne Fehler',
      icon: AlertTriangle,
      score: 100 - metrics.error_rate,
      target: 95
    },
    {
      id: 'freshness',
      name: 'Aktualität',
      description: 'Kürzlich aktualisiert',
      icon: Calendar,
      score: metrics.freshness,
      target: 50
    }
  ];

  const overallScore = qualityChecks.reduce((sum, c) => sum + c.score, 0) / qualityChecks.length;

  const getScoreColor = (score, target) => {
    if (score >= target) return 'green';
    if (score >= target * 0.8) return 'yellow';
    return 'red';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Datenqualität-Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Gesamt-Datenqualität</span>
            <span className="text-2xl font-bold text-blue-700">
              {overallScore.toFixed(0)}%
            </span>
          </div>
          <Progress value={overallScore} className="h-2" />
          <div className="text-xs text-slate-600 mt-2">
            Basierend auf {qualityChecks.length} Qualitäts-Metriken
          </div>
        </div>

        {/* Quality Checks */}
        <div className="space-y-2">
          {qualityChecks.map(check => {
            const Icon = check.icon;
            const color = getScoreColor(check.score, check.target);
            const meetsTarget = check.score >= check.target;

            return (
              <div key={check.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 text-${color}-600`} />
                    <div>
                      <div className="font-medium text-sm">{check.name}</div>
                      <div className="text-xs text-slate-600">{check.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`bg-${color}-100 text-${color}-800`}>
                      {check.score.toFixed(0)}%
                    </Badge>
                    {meetsTarget && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={check.score} className="h-1 flex-1" />
                  <span className="text-xs text-slate-500">Ziel: {check.target}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Items */}
        <div className="pt-4 border-t">
          <div className="text-sm font-medium mb-3">Verbesserungspotenzial</div>
          <div className="space-y-2">
            {qualityChecks
              .filter(c => c.score < c.target)
              .map(check => (
                <div key={check.id} className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <span className="text-sm text-yellow-900">
                    {check.name} verbessern
                  </span>
                  <Badge variant="outline">
                    +{(check.target - check.score).toFixed(0)}%
                  </Badge>
                </div>
              ))
            }
            {qualityChecks.every(c => c.score >= c.target) && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-sm font-medium text-green-900">
                  Alle Ziele erreicht!
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}