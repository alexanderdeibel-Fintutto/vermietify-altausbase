import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import APIKeyManager from '@/components/api/APIKeyManager';
import WebhookManager from '@/components/integrations/WebhookManager';

export default function APIKeyManagement() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="API & Webhooks"
        subtitle="Verwalten Sie Ihre API-Zugänge"
      />

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <APIKeyManager />
        <WebhookManager />
      </div>
    </div>
  );
}