import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, Send } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function SubmissionHistory({ buildingId, submissions }) {
  const buildingSubmissions = buildingId 
    ? submissions.filter(s => s.building_id === buildingId)
    : submissions;

  const sortedSubmissions = [...buildingSubmissions].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DRAFT':
      case 'AI_PROCESSED':
        return Clock;
      case 'VALIDATED':
        return CheckCircle;
      case 'SUBMITTED':
      case 'ACCEPTED':
        return Send;
      default:
        return FileText;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'VALIDATED':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (sortedSubmissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historie</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-500 py-8">
            Noch keine Submissions für dieses Gebäude
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submissions-Historie</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedSubmissions.map(sub => {
            const StatusIcon = getStatusIcon(sub.status);
            return (
              <div key={sub.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <StatusIcon className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{sub.tax_form_type}</span>
                    <Badge variant="outline" className="text-xs">
                      {sub.tax_year}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600">
                    {format(new Date(sub.created_date), 'dd. MMM yyyy, HH:mm', { locale: de })}
                  </div>
                  {sub.ai_confidence_score && (
                    <div className="text-xs text-slate-500 mt-1">
                      KI-Vertrauen: {sub.ai_confidence_score}%
                    </div>
                  )}
                </div>
                <Badge className={getStatusColor(sub.status)}>
                  {sub.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}