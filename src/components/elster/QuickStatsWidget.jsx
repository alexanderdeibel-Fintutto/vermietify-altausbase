import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function QuickStatsWidget() {
  const { data: submissions = [] } = useQuery({
    queryKey: ['elster-submissions'],
    queryFn: () => base44.entities.ElsterSubmission.list('-created_date')
  });

  const stats = {
    total: submissions.length,
    accepted: submissions.filter(s => s.status === 'ACCEPTED').length,
    pending: submissions.filter(s => s.status === 'DRAFT' || s.status === 'VALIDATED').length,
    errors: submissions.filter(s => s.validation_errors?.length > 0).length
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      <Card>
        <CardContent className="p-4 text-center">
          <FileText className="w-6 h-6 mx-auto mb-2 text-slate-600" />
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-slate-600">Gesamt</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          <div className="text-xs text-slate-600">Akzeptiert</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-xs text-slate-600">Offen</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-600" />
          <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
          <div className="text-xs text-slate-600">Fehler</div>
        </CardContent>
      </Card>
    </div>
  );
}