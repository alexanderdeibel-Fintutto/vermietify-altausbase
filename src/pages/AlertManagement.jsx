import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import AlertManager from '@/components/reporting/AlertManager';
import AlertPreferences from '@/components/notifications/AlertPreferences';

export default function AlertManagement() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Benachrichtigungen & Alerts"
        subtitle="Verwalten Sie Ihre Benachrichtigungen"
      />

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <AlertManager />
        <AlertPreferences />
      </div>
    </div>
  );
}