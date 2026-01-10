import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AuditLogViewer from '@/components/audit/AuditLogViewer';
import { Shield } from 'lucide-react';

export default function AuditLogPage() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Audit Log</h1>
          <p className="text-slate-600">Alle Aktionen und Änderungen im System</p>
        </div>
      </div>

      {user && <AuditLogViewer companyId={user.id} />}
    </div>
  );
}