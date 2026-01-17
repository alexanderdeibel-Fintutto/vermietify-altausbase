import React from 'react';
import ExportMenu from '@/components/export/ExportMenu';
import { useMutation } from '@tanstack/react-query';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function DataExportButton({ data, filename }) {
  const exportMutation = useMutation({
    mutationFn: async (format) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      showSuccess('Export erfolgreich');
    }
  });

  return (
    <ExportMenu
      onExportJSON={() => exportMutation.mutate('json')}
      onExportCSV={() => exportMutation.mutate('csv')}
      loading={exportMutation.isPending}
    />
  );
}