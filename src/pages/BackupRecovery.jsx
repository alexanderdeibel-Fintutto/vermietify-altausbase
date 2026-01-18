import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BackupRestore from '@/components/backup/BackupRestore';

export default function BackupRecovery() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Datensicherung"
        subtitle="Sichern und wiederherstellen Sie Ihre Daten"
      />
      <div className="mt-6">
        <BackupRestore />
      </div>
    </div>
  );
}