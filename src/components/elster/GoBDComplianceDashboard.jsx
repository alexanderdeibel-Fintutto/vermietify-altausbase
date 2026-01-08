import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Shield, FileText, Calendar, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function GoBDComplianceDashboard() {
  const { data: submissions = [] } = useQuery({
    queryKey: ['elster-submissions'],
    queryFn: () => base44.entities.ElsterSubmission.list()
  });

  const archivedCount = submissions.filter(s => s.status === 'ARCHIVED').length;
  const needsArchiving = submissions.filter(s => 
    s.status === 'ACCEPTED' && !s.archived_at
  ).length;
  
  const oldestArchived = submissions
    .filter(s => s.archived_at)
    .sort((a, b) => new Date(a.archived_at) - new Date(b.archived_at))[0];

  const currentYear = new Date().getFullYear();
  const retentionDeadline = oldestArchived 
    ? new Date(oldestArchived.archived_at).getFullYear() + 10
    : null;

  const complianceItems = [
    {
      title: 'Unveränderbarkeit',
      description: 'Archivierte Daten sind unveränderbar gespeichert',
      status: archivedCount > 0 ? 'ok' : 'info',
      icon: Lock
    },
    {
      title: 'Aufbewahrungsfrist',
      description: `10 Jahre ab Archivierung ${retentionDeadline ? `(bis ${retentionDeadline})` : ''}`,
      status: 'ok',
      icon: Calendar
    },
    {
      title: 'Nachvollziehbarkeit',
      description: 'Vollständiger Audit-Trail für alle Submissions',
      status: 'ok',
      icon: FileText
    },
    {
      title: 'Datensicherheit',
      description: 'Verschlüsselte Speicherung aller Zertifikate',
      status: 'ok',
      icon: Shield
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-2 border-emerald-200 bg-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            GoBD-Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <div className="text-3xl font-bold text-emerald-600">{archivedCount}</div>
              <div className="text-sm text-slate-600">Archivierte Submissions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-600">{needsArchiving}</div>
              <div className="text-sm text-slate-600">Benötigen Archivierung</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {retentionDeadline ? retentionDeadline - currentYear : '-'}
              </div>
              <div className="text-sm text-slate-600">Jahre bis Löschung</div>
            </div>
          </div>

          <div className="space-y-3">
            {complianceItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    item.status === 'ok' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      item.status === 'ok' ? 'text-green-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-slate-600">{item.description}</div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {needsArchiving > 0 && (
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertTriangle className="w-5 h-5" />
              Archivierung erforderlich
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              {needsArchiving} akzeptierte Submission(s) müssen GoBD-konform archiviert werden.
            </p>
            <Button className="bg-yellow-600 hover:bg-yellow-700">
              Jetzt archivieren
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}