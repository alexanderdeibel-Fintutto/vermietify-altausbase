import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Upload, Download, Search, Settings } from 'lucide-react';
import AutoBackupSystem from '@/components/backup/AutoBackupSystem';
import BulkCSVImportDialog from '@/components/import/BulkCSVImportDialog';
import AdvancedSearchWithSave from '@/components/search/AdvancedSearchWithSave';
import BulkExportDialog from '@/components/bulk/BulkExportDialog';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const SEARCH_FIELDS = {
  Invoice: [
    { value: 'description', label: 'Beschreibung', type: 'text' },
    { value: 'recipient', label: 'Empfänger', type: 'text' },
    { value: 'amount', label: 'Betrag', type: 'number' },
    { value: 'invoice_date', label: 'Rechnungsdatum', type: 'date' },
    { value: 'status', label: 'Status', type: 'text' }
  ],
  Tenant: [
    { value: 'first_name', label: 'Vorname', type: 'text' },
    { value: 'last_name', label: 'Nachname', type: 'text' },
    { value: 'email', label: 'E-Mail', type: 'text' },
    { value: 'phone', label: 'Telefon', type: 'text' }
  ],
  LeaseContract: [
    { value: 'tenant_name', label: 'Mieter', type: 'text' },
    { value: 'base_rent', label: 'Kaltmiete', type: 'number' },
    { value: 'start_date', label: 'Startdatum', type: 'date' },
    { value: 'status', label: 'Status', type: 'text' }
  ]
};

export default function DataManagementHub() {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState('Invoice');

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list()
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const entityData = {
    Invoice: invoices,
    Tenant: tenants,
    LeaseContract: contracts
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light text-slate-900">Datenmanagement</h1>
        <p className="text-sm text-slate-600 mt-1">Import, Export, Backup und erweiterte Suche</p>
      </div>

      <Tabs defaultValue="backup">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="backup" className="gap-2">
            <Database className="w-4 h-4" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="w-4 h-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <Search className="w-4 h-4" />
            Suche
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backup" className="mt-6">
          <AutoBackupSystem />
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk-Import aus CSV/Excel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Importieren Sie große Datenmengen aus CSV- oder Excel-Dateien.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => {
                    setSelectedEntity('Invoice');
                    setImportDialogOpen(true);
                  }}
                >
                  <Upload className="w-6 h-6" />
                  <span>Rechnungen importieren</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => {
                    setSelectedEntity('Tenant');
                    setImportDialogOpen(true);
                  }}
                >
                  <Upload className="w-6 h-6" />
                  <span>Mieter importieren</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => {
                    setSelectedEntity('Unit');
                    setImportDialogOpen(true);
                  }}
                >
                  <Upload className="w-6 h-6" />
                  <span>Einheiten importieren</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Daten exportieren</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Exportieren Sie Ihre Daten in verschiedenen Formaten (CSV, Excel, JSON).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Rechnungen</h3>
                  <p className="text-sm text-slate-600 mb-3">{invoices.length} Datensätze</p>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      setSelectedEntity('Invoice');
                      setExportDialogOpen(true);
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Exportieren
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Mieter</h3>
                  <p className="text-sm text-slate-600 mb-3">{tenants.length} Datensätze</p>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      setSelectedEntity('Tenant');
                      setExportDialogOpen(true);
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Exportieren
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Verträge</h3>
                  <p className="text-sm text-slate-600 mb-3">{contracts.length} Datensätze</p>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      setSelectedEntity('LeaseContract');
                      setExportDialogOpen(true);
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Exportieren
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Erweiterte Suche mit gespeicherten Filtern</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Erstellen Sie komplexe Suchfilter und speichern Sie diese für spätere Nutzung.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => {
                    setSelectedEntity('Invoice');
                    setSearchDialogOpen(true);
                  }}
                >
                  <Search className="w-6 h-6" />
                  <span>Rechnungen durchsuchen</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => {
                    setSelectedEntity('Tenant');
                    setSearchDialogOpen(true);
                  }}
                >
                  <Search className="w-6 h-6" />
                  <span>Mieter durchsuchen</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => {
                    setSelectedEntity('LeaseContract');
                    setSearchDialogOpen(true);
                  }}
                >
                  <Search className="w-6 h-6" />
                  <span>Verträge durchsuchen</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BulkCSVImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        entityType={selectedEntity}
        onSuccess={() => {
          setImportDialogOpen(false);
        }}
      />

      <BulkExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        data={entityData[selectedEntity]}
        entityType={selectedEntity}
        filename={`${selectedEntity}_export`}
      />

      <AdvancedSearchWithSave
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        entityType={selectedEntity}
        fields={SEARCH_FIELDS[selectedEntity] || []}
        onSearch={(conditions) => {
          console.log('Search conditions:', conditions);
          toast.success('Suche wird durchgeführt...');
        }}
      />
    </div>
  );
}