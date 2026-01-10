import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Trash2, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ReportsList({ user }) {
  const { data: reports = [] } = useQuery({
    queryKey: ['saved-reports', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // This would fetch from a SavedReports entity if it exists
      return [];
    },
    enabled: !!user?.email
  });

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">Noch keine Berichte erstellt</p>
          <p className="text-slate-500 text-sm">
            Erstellen Sie einen Bericht mit einer Vorlage oder einem benutzerdefinierten Builder
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Berichtsverlauf</h2>
      <div className="grid gap-4">
        {reports.map(report => (
          <Card key={report.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{report.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{report.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="text-xs">
                      {report.entity}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {format(new Date(report.created_date), 'dd. MMMM yyyy, HH:mm', { locale: de })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}