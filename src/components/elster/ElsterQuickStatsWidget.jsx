import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

export default function ElsterQuickStatsWidget() {
  const { data: submissions = [] } = useQuery({
    queryKey: ['elster-submissions'],
    queryFn: () => base44.entities.ElsterSubmission.list('-created_date', 50)
  });

  const stats = {
    total: submissions.length,
    draft: submissions.filter(s => s.status === 'DRAFT').length,
    validated: submissions.filter(s => s.status === 'VALIDATED').length,
    submitted: submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'ACCEPTED').length,
    needsAttention: submissions.filter(s => s.validation_errors?.length > 0).length,
    thisYear: submissions.filter(s => s.tax_year === new Date().getFullYear()).length
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          ELSTER-Übersicht
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-600">Gesamt</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>

          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-green-700 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Übermittelt
            </div>
            <div className="text-2xl font-bold text-green-700">{stats.submitted}</div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700">Dieses Jahr</div>
            <div className="text-2xl font-bold text-blue-700">{stats.thisYear}</div>
          </div>

          {stats.needsAttention > 0 && (
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="text-sm text-yellow-700 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Benötigen Aufmerksamkeit
              </div>
              <div className="text-2xl font-bold text-yellow-700">{stats.needsAttention}</div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Status-Verteilung:</span>
            <div className="flex gap-2">
              {stats.draft > 0 && <Badge variant="outline">{stats.draft} Draft</Badge>}
              {stats.validated > 0 && <Badge variant="outline">{stats.validated} Validiert</Badge>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}