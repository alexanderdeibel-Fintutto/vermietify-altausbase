import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Eye, Edit, Trash2, Plus, Lock } from 'lucide-react';

const actionIcons = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  view: Eye,
  access: Lock
};

export default function CompanyAuditLog({ companyId }) {
  const { data: logs = [] } = useQuery({
    queryKey: ['company-audit-log', companyId],
    queryFn: async () => {
      // Diese Daten würden von einer Audit-Log-Entity kommen
      // Für jetzt simulieren wir mit leeren Logs
      return [];
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Audit-Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">Keine Änderungen erfasst</p>
          ) : (
            logs.map((log, idx) => {
              const IconComponent = actionIcons[log.action] || Eye;
              return (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border">
                  <IconComponent className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{log.action}</p>
                      <Badge variant="outline" className="text-xs">{log.entity}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">Von {log.user}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}