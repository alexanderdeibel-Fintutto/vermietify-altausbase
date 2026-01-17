import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import AuditLogViewer from '@/components/audit/AuditLogViewer';

export default function AuditLog() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Aktivitätsprotokoll"
        subtitle="Alle Aktivitäten im Überblick"
      />

      <AuditLogViewer limit={50} />
    </div>
  );
}