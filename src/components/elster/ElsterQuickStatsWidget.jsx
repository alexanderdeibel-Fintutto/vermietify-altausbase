import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ElsterQuickStatsWidget() {
  const { data: submissions = [] } = useQuery({
    queryKey: ['elster-submissions-widget'],
    queryFn: () => base44.entities.ElsterSubmission.list('-created_date', 20)
  });

  const stats = {
    total: submissions.length,
    draft: submissions.filter(s => s.status === 'DRAFT' || s.status === 'AI_PROCESSED').length,
    pending: submissions.filter(s => s.status === 'VALIDATED' || s.status === 'SUBMITTED').length,
    accepted: submissions.filter(s => s.status === 'ACCEPTED').length,
    avgConfidence: submissions.length > 0
      ? Math.round(submissions.reduce((sum, s) => sum + (s.ai_confidence_score || 0), 0) / submissions.length)
      : 0
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">🏛️ ELSTER-Integration</CardTitle>
          <Link to={createPageUrl('ElsterIntegration')}>
            <Badge variant="outline" className="cursor-pointer hover:bg-slate-50">
              Öffnen →
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-slate-50 rounded">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-slate-600" />
                <span className="text-xs text-slate-600">Gesamt</span>
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600">Akzeptiert</span>
              </div>
              <div className="text-2xl font-bold text-green-700">{stats.accepted}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-yellow-50 rounded">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-xs text-yellow-600">Entwürfe</span>
              </div>
              <div className="text-2xl font-bold text-yellow-700">{stats.draft}</div>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-600">Wartend</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">{stats.pending}</div>
            </div>
          </div>

          {stats.avgConfidence > 0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-slate-600">Ø KI-Vertrauen</span>
                </div>
                <span className="font-bold text-purple-700">{stats.avgConfidence}%</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}