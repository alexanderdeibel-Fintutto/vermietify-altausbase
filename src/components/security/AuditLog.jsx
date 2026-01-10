import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, Eye } from 'lucide-react';

export default function AuditLog() {
  const { data: logs = [] } = useQuery({
    queryKey: ['auditLog'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAuditLog', { limit: 50 });
      return response.data.logs;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Audit-Protokoll
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {logs.map((log, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs">
            <div className="flex items-center gap-2">
              <Eye className="w-3 h-3 text-slate-600" />
              <span className="font-semibold">{log.action}</span>
              <span className="text-slate-600">{log.user_email}</span>
            </div>
            <span className="text-slate-400">{new Date(log.timestamp).toLocaleString('de-DE')}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}