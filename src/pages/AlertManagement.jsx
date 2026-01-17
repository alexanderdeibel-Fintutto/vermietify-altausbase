import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import AlertManager from '@/components/reporting/AlertManager';
import AlertPreferences from '@/components/notifications/AlertPreferences';

export default function AlertManagement() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Warnungen & Benachrichtigungen"
        subtitle="Konfigurieren Sie automatische Benachrichtigungen"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <AlertManager />
        <AlertPreferences />
      </div>
    </div>
  );
}