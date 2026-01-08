import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ComplianceScoreCard({ submissionId }) {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (submissionId) {
      loadScore();
    }
  }, [submissionId]);

  const loadScore = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('calculateComplianceScore', {
        submission_id: submissionId
      });

      if (response.data.success) {
        setScore(response.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !score) return null;

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compliance Score
          </div>
          <Badge className={getGradeColor(score.grade)}>
            {score.grade}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold">{score.score}</div>
          <Progress value={score.score} className="mt-2" />
          <div className="text-xs text-slate-600 mt-1">{score.recommendation}</div>
        </div>

        {score.issues.length > 0 && (
          <div className="space-y-2">
            {score.issues.map((issue, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded">
                <AlertTriangle className="w-3 h-3 text-orange-600" />
                <span>{issue.type}: -{issue.penalty} Punkte</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}