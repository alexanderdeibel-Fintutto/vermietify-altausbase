import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Building2, Calendar, Euro, MapPin, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TenantContractsOverview({ tenantId }) {
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['tenant-all-contracts', tenantId],
    queryFn: () => base44.entities.LeaseContract.filter({ tenant_id: tenantId }, '-start_date', 50)
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-for-contracts'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units-for-contracts'],
    queryFn: () => base44.entities.Unit.list()
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-500">
          Lade Verträge...
        </CardContent>
      </Card>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">Keine Mietverträge vorhanden</p>
        </CardContent>
      </Card>
    );
  }

  const aktiveVertraege = contracts.filter(c => c.vertragsstatus === 'Aktiv');
  const ehemaligeVertraege = contracts.filter(c => ['Beendet', 'Gekündigt'].includes(c.vertragsstatus));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6">
            <p className="text-xs text-emerald-700">Aktive Verträge</p>
            <p className="text-2xl font-semibold text-emerald-900">{aktiveVertraege.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <p className="text-xs text-slate-600">Gesamt-Verträge</p>
            <p className="text-2xl font-semibold text-slate-900">{contracts.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <p className="text-xs text-slate-600">Gesamtmiete aktuell</p>
            <p className="text-2xl font-semibold text-slate-900">
              {formatCurrency(aktiveVertraege.reduce((sum, c) => sum + (c.warmmiete || 0), 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Contracts */}
      {aktiveVertraege.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-slate-900">Aktive Mietverträge</h3>
          {aktiveVertraege.map(contract => {
            const building = buildings.find(b => units.find(u => u.id === contract.unit_id)?.gebaeude_id === b.id);
            const unit = units.find(u => u.id === contract.unit_id);

            return (
              <Card key={contract.id} className="border-emerald-200 hover:border-emerald-300 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-600">Aktiv</Badge>
                        <Badge variant="outline">{contract.vertragsart}</Badge>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        {building && (
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{building.name}</span>
                            {unit && <span className="text-slate-500">• {unit.unit_number}</span>}
                          </div>
                        )}
                        
                        {building && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span>{building.address}, {building.postal_code} {building.city}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>
                            seit {format(new Date(contract.start_date), 'dd.MM.yyyy', { locale: de })}
                            {contract.end_date && ` bis ${format(new Date(contract.end_date), 'dd.MM.yyyy', { locale: de })}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Euro className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">{formatCurrency(contract.warmmiete)} Warmmiete</span>
                          <span className="text-slate-500">
                            ({formatCurrency(contract.kaltmiete)} + {formatCurrency(contract.nebenkosten_vz)} NK)
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button size="sm" variant="outline" asChild>
                      <Link to={createPageUrl('ContractDetail') + `?id=${contract.id}`}>
                        Details <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Former Contracts */}
      {ehemaligeVertraege.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-slate-700">Ehemalige Mietverträge</h3>
          {ehemaligeVertraege.map(contract => {
            const building = buildings.find(b => units.find(u => u.id === contract.unit_id)?.gebaeude_id === b.id);
            const unit = units.find(u => u.id === contract.unit_id);

            return (
              <Card key={contract.id} className="border-slate-200 opacity-75 hover:opacity-100 transition-opacity">
                <CardContent className="py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{contract.vertragsstatus}</Badge>
                        {building && <span className="text-sm font-medium text-slate-700">{building.name}</span>}
                        {unit && <span className="text-sm text-slate-500">• {unit.unit_number}</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(contract.start_date), 'dd.MM.yyyy', { locale: de })} - 
                        {contract.end_date ? format(new Date(contract.end_date), 'dd.MM.yyyy', { locale: de }) : 'laufend'}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-slate-700">{formatCurrency(contract.warmmiete)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dokument hochladen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Dokumenttyp *</Label>
              <Select 
                value={documentData.dokumenttyp}
                onValueChange={v => setDocumentData({...documentData, dokumenttyp: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHUFA-Auskunft">SCHUFA-Auskunft</SelectItem>
                  <SelectItem value="Einkommensnachweis">Einkommensnachweis</SelectItem>
                  <SelectItem value="Ausweiskopie">Ausweiskopie</SelectItem>
                  <SelectItem value="Mietbürgschaft">Mietbürgschaft</SelectItem>
                  <SelectItem value="SEPA-Mandat">SEPA-Mandat</SelectItem>
                  <SelectItem value="Sonstige">Sonstige</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Titel *</Label>
              <Input
                value={documentData.titel}
                onChange={e => setDocumentData({...documentData, titel: e.target.value})}
                placeholder="z.B. SCHUFA-Auskunft vom 12.01.2026"
              />
            </div>

            <div>
              <Label>Datei *</Label>
              <Input
                type="file"
                onChange={e => setDocumentData({...documentData, file: e.target.files[0]})}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Hochladen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}