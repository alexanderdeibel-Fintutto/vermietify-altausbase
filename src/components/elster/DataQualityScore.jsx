import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function DataQualityScore() {
  const { data: submissions = [] } = useQuery({
    queryKey: ['elster-submissions'],
    queryFn: () => base44.entities.ElsterSubmission.list()
  });

  const calculateQuality = () => {
    if (submissions.length === 0) return { score: 0, issues: [] };

    let score = 100;
    const issues = [];

    // Prüfe auf fehlende Daten
    const incomplete = submissions.filter(s => !s.form_data || Object.keys(s.form_data).length < 5);
    if (incomplete.length > 0) {
      score -= Math.min(20, incomplete.length * 5);
      issues.push(`${incomplete.length} Submissions mit unvollständigen Daten`);
    }

    // Prüfe auf Validierungsfehler
    const withErrors = submissions.filter(s => s.validation_errors?.length > 0);
    if (withErrors.length > 0) {
      score -= Math.min(30, withErrors.length * 3);
      issues.push(`${withErrors.length} Submissions mit Validierungsfehlern`);
    }

    // Prüfe auf niedrige AI-Confidence
    const lowConfidence = submissions.filter(s => s.ai_confidence_score && s.ai_confidence_score < 70);
    if (lowConfidence.length > 0) {
      score -= Math.min(15, lowConfidence.length * 2);
      issues.push(`${lowConfidence.length} Submissions mit niedriger KI-Vertrauenswürdigkeit`);
    }

    // Prüfe auf fehlende XMLs
    const missingXML = submissions.filter(s => s.status !== 'DRAFT' && !s.xml_data);
    if (missingXML.length > 0) {
      score -= Math.min(10, missingXML.length * 2);
      issues.push(`${missingXML.length} Submissions ohne XML`);
    }

    return { score: Math.max(0, score), issues };
  };

  const { score, issues } = calculateQuality();

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Datenqualität
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
          <div className="text-sm text-slate-600">Qualitäts-Score</div>
        </div>

        <Progress value={score} />

        {issues.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-medium">Gefundene Probleme</div>
            {issues.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>Keine Probleme gefunden</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}