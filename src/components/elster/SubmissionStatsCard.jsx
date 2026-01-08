import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function SubmissionStatsCard({ submissions }) {
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  const thisYearSubmissions = submissions.filter(s => s.tax_year === currentYear);
  const lastYearSubmissions = submissions.filter(s => s.tax_year === lastYear);

  const thisYearCount = thisYearSubmissions.length;
  const lastYearCount = lastYearSubmissions.length;
  const change = lastYearCount > 0 
    ? ((thisYearCount - lastYearCount) / lastYearCount * 100).toFixed(0)
    : 0;

  const acceptedThisYear = thisYearSubmissions.filter(s => s.status === 'ACCEPTED').length;
  const acceptanceRate = thisYearCount > 0 
    ? ((acceptedThisYear / thisYearCount) * 100).toFixed(0)
    : 0;

  const avgConfidence = thisYearSubmissions
    .filter(s => s.ai_confidence_score)
    .reduce((sum, s) => sum + s.ai_confidence_score, 0) / thisYearSubmissions.filter(s => s.ai_confidence_score).length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiken {currentYear}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">{thisYearCount}</div>
            <div className="text-sm text-slate-600">Submissions</div>
            {change !== 0 && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${
                change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(change)}% vs {lastYear}
              </div>
            )}
          </div>

          <div>
            <div className="text-2xl font-bold">{acceptanceRate}%</div>
            <div className="text-sm text-slate-600">Akzeptanzrate</div>
            <div className="text-xs text-slate-500 mt-1">
              {acceptedThisYear} von {thisYearCount}
            </div>
          </div>
        </div>

        {avgConfidence > 0 && (
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-600">Ø KI-Vertrauen</span>
              <span className="font-medium">{avgConfidence.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all" 
                style={{ width: `${avgConfidence}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}