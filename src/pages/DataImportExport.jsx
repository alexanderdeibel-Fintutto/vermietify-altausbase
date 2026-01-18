import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BulkCSVImportDialog from '@/components/import/BulkCSVImportDialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';

export default function DataImportExport() {
  const [importOpen, setImportOpen] = React.useState(false);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Import & Export"
        subtitle="Daten importieren und exportieren"
      />

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Daten importieren
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
              Importieren Sie Objekte, Mieter oder Verträge aus CSV-Dateien
            </p>
            <Button variant="gradient" className="w-full" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              CSV importieren
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
              Exportieren Sie Ihre Daten in verschiedenen Formaten
            </p>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Alle Daten exportieren
            </Button>
          </CardContent>
        </Card>
      </div>

      <BulkCSVImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}