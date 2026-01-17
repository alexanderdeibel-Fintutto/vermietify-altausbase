import React, { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BulkCSVImportDialog from '@/components/import/BulkCSVImportDialog';
import ExportButton from '@/components/reporting/ExportButton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, Database } from 'lucide-react';

export default function DataImportExport() {
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Daten Import/Export"
        subtitle="Verwalten Sie Ihre Daten"
      />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Daten importieren
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
              Importieren Sie Mieter, Objekte oder Rechnungen aus CSV-Dateien
            </p>
            <Button variant="gradient" onClick={() => setImportDialogOpen(true)} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              CSV hochladen
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Daten exportieren
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
              Exportieren Sie alle Daten in verschiedenen Formaten
            </p>
            <ExportButton filename="vermitify-export" />
          </CardContent>
        </Card>
      </div>

      <BulkCSVImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={(data) => {
          console.log('Import:', data);
          setImportDialogOpen(false);
        }}
      />
    </div>
  );
}