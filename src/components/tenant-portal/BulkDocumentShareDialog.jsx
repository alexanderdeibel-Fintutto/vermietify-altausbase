import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share2, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkDocumentShareDialog({ buildingId }) {
  const [open, setOpen] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [docType, setDocType] = useState('notice');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const queryClient = useQueryClient();
  
  // Units mit aktiven Mietern laden
  const { data: activeContracts = [] } = useQuery({
    queryKey: ['active-contracts', buildingId],
    queryFn: async () => {
      const filter = buildingId 
        ? { vertragsstatus: 'Aktiv', unit_id: buildingId }
        : { vertragsstatus: 'Aktiv' };
      return base44.entities.LeaseContract.filter(filter);
    },
    enabled: open
  });
  
  // Units laden
  const { data: units = [] } = useQuery({
    queryKey: ['units', buildingId],
    queryFn: () => buildingId
      ? base44.entities.Unit.filter({ gebaeude_id: buildingId })
      : base44.entities.Unit.list(),
    enabled: open
  });
  
  const bulkShareMutation = useMutation({
    mutationFn: async () => {
      // Datei hochladen
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const sharedDocs = [];
      
      // Für jede ausgewählte Unit
      for (const unitId of selectedUnits) {
        const contract = activeContracts.find(c => c.unit_id === unitId);
        if (!contract) continue;
        
        const tenants = await base44.entities.Tenant.filter({ id: contract.tenant_id });
        const tenant = tenants[0];
        
        // Portal-Dokument erstellen
        const doc = await base44.entities.TenantPortalDocument.create({
          unit_id: unitId,
          building_id: buildingId,
          tenant_id: tenant.id,
          document_type: docType,
          title,
          file_url,
          file_size: file.size,
          document_date: new Date().toISOString().split('T')[0],
          is_visible: true
        });
        
        sharedDocs.push(doc);
        
        // E-Mail senden
        if (tenant.email) {
          await base44.integrations.Core.SendEmail({
            to: tenant.email,
            subject: `Neues Dokument: ${title}`,
            body: `
              <h2>Neues Dokument verfügbar</h2>
              <p>Hallo ${tenant.first_name} ${tenant.last_name},</p>
              <p>Ein neues Dokument wurde für Sie freigegeben:</p>
              <p><strong>${title}</strong></p>
              <p>Sie können es in Ihrer MieterApp einsehen.</p>
              <p><a href="https://mieterapp.fintutto.de">Zur MieterApp</a></p>
            `
          });
        }
      }
      
      return sharedDocs;
    },
    onSuccess: (docs) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-portal-documents'] });
      toast.success(`Dokument mit ${docs.length} Mietern geteilt!`);
      setOpen(false);
      setSelectedUnits([]);
      setTitle('');
      setFile(null);
    }
  });
  
  const toggleUnit = (unitId) => {
    setSelectedUnits(prev => 
      prev.includes(unitId) 
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };
  
  const selectAll = () => {
    const allUnitIds = activeContracts.map(c => c.unit_id);
    setSelectedUnits(allUnitIds);
  };
  
  const deselectAll = () => {
    setSelectedUnits([]);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Share2 className="w-4 h-4" />
          Dokument an mehrere Mieter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dokument mit mehreren Mietern teilen</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Dokumenttyp</label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="notice">Mitteilung</SelectItem>
                <SelectItem value="announcement">Ankündigung</SelectItem>
                <SelectItem value="utility_bills">Versorgungsrechnung</SelectItem>
                <SelectItem value="other">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Titel</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Wichtige Mitteilung an alle Mieter"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Datei</label>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Empfänger auswählen ({selectedUnits.length} ausgewählt)</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Alle auswählen
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Alle abwählen
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
              {activeContracts.map(contract => {
                const unit = units.find(u => u.id === contract.unit_id);
                const isSelected = selectedUnits.includes(contract.unit_id);
                
                return (
                  <div
                    key={contract.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                      isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleUnit(contract.unit_id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleUnit(contract.unit_id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        {unit?.unit_number || contract.unit_id}
                      </p>
                      <p className="text-sm text-gray-600">
                        Mieter: ID {contract.tenant_id}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => bulkShareMutation.mutate()}
              disabled={!title || !file || selectedUnits.length === 0 || bulkShareMutation.isPending}
              className="flex-1"
            >
              {bulkShareMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Teile mit {selectedUnits.length} Mietern...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Mit {selectedUnits.length} Mietern teilen
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}