import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import AuditLogViewer from '@/components/audit/AuditLogViewer';
import ExportButton from '@/components/reporting/ExportButton';

export default function AuditLog() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Audit-Protokoll"
        subtitle="Vollständige Nachverfolgung aller Änderungen"
        actions={<ExportButton />}
      />
      
      <div className="mt-6">
        <AuditLogViewer />
      </div>
    </div>
  );
}