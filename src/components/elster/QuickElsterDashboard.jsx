import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileCheck, AlertTriangle, Clock, CheckCircle, 
  Plus, Download, Send 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function QuickElsterDashboard() {
  const { data: submissions = [] } = useQuery({
    queryKey: ['elster-quick-dashboard'],
    queryFn: () => base44.entities.ElsterSubmission.list('-created_date', 50)
  });

  const stats = {
    draft: submissions.filter(s => s.status === 'DRAFT').length,
    pending: submissions.filter(s => ['AI_PROCESSED', 'VALIDATED'].includes(s.status)).length,
    accepted: submissions.filter(s => s.status === 'ACCEPTED').length,
    errors: submissions.filter(s => s.validation_errors?.length > 0).length
  };

  const recent = submissions.slice(0, 5);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DRAFT': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'AI_PROCESSED':
      case 'VALIDATED': return <AlertTriangle className="w-4 h-4 text-blue-600" />;
      case 'ACCEPTED': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <FileCheck className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.draft}</div>
            <div className="text-xs text-slate-600 mt-1">Entwürfe</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-slate-600 mt-1">Zu übermitteln</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.accepted}</div>
            <div className="text-xs text-slate-600 mt-1">Akzeptiert</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-red-600">{stats.errors}</div>
            <div className="text-xs text-slate-600 mt-1">Mit Fehlern</div>
          </CardContent>
        </Card>
      </div>

      {/* Schnellaktionen */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Neues Formular
        </Button>
        <Button size="sm" variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportieren
        </Button>
        <Button size="sm" variant="outline" className="gap-2">
          <Send className="w-4 h-4" />
          Alle übermitteln
        </Button>
      </div>

      {/* Letzte Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Letzte Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recent.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Keine Submissions vorhanden</p>
            ) : (
              recent.map(sub => (
                <div 
                  key={sub.id} 
                  className="flex items-center justify-between p-2 hover:bg-slate-50 rounded text-sm"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(sub.status)}
                    <div>
                      <div className="font-medium">{sub.tax_form_type}</div>
                      <div className="text-xs text-slate-500">{sub.tax_year} • {sub.legal_form}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {sub.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}