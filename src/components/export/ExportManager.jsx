import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import BulkExportDialog from './BulkExportDialog';
import { toast } from 'sonner';

export default function ExportManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async ({ items, format }) => {
    setIsExporting(true);
    try {
      const exportData = {};

      // Fetch selected data
      for (const item of items) {
        if (item === 'buildings') {
          exportData.buildings = await base44.entities.Building.list();
        } else if (item === 'tenants') {
          exportData.tenants = await base44.entities.Tenant.list();
        } else if (item === 'contracts') {
          exportData.contracts = await base44.entities.LeaseContract.list();
        } else if (item === 'statements') {
          exportData.statements = await base44.entities.OperatingCostStatement.list();
        } else if (item === 'documents') {
          exportData.documents = await base44.entities.Document.list();
        }
      }

      // Format and download
      if (format === 'json') {
        const json = JSON.stringify(exportData, null, 2);
        downloadFile(json, 'export.json', 'application/json');
      } else if (format === 'csv') {
        // Convert first entity to CSV as example
        const firstEntity = Object.values(exportData)[0] || [];
        if (firstEntity.length > 0) {
          const headers = Object.keys(firstEntity[0]);
          const csv = [
            headers.join(','),
            ...firstEntity.map(row =>
              headers.map(h => {
                const val = row[h];
                return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
              }).join(',')
            )
          ].join('\n');
          downloadFile(csv, 'export.csv', 'text/csv');
        }
      }

      toast.success('Export erfolgreich!');
    } catch (error) {
      toast.error('Export fehlgeschlagen: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadFile = (content, name, type) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        Bulk Export
      </Button>

      <BulkExportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onExport={handleExport}
      />
    </>
  );
}