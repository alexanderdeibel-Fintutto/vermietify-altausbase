import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

export default function BulkExportButton({ entityName, filters = {}, filename }) {
  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('exportLeadsToCSV', filters);
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `export_${entityName}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    }
  });

  return (
    <Button 
      variant="outline"
      onClick={() => exportMutation.mutate()}
      disabled={exportMutation.isPending}
    >
      <Download className="h-4 w-4 mr-2" />
      {exportMutation.isPending ? 'Exportiere...' : 'CSV Export'}
    </Button>
  );
}