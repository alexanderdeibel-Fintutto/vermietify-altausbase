import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const DOCUMENT_TYPES = {
  mietvertrag: { label: 'Mietvertrag', requiredFields: ['tenant_id', 'unit_id', 'start_date', 'base_rent'] },
  uebergabeprotokoll_einzug: { label: 'Übergabeprotokoll (Einzug)', requiredFields: ['tenant_id', 'unit_id'] },
  uebergabeprotokoll_auszug: { label: 'Übergabeprotokoll (Auszug)', requiredFields: ['tenant_id', 'unit_id'] },
  sepa_mandat: { label: 'SEPA-Lastschriftmandat', requiredFields: ['tenant_id', 'contract_id'] },
  zahlungserinnerung: { label: 'Zahlungserinnerung', requiredFields: ['tenant_id', 'contract_id'] },
  mahnung: { label: 'Mahnung', requiredFields: ['tenant_id', 'contract_id'] },
  kuendigung: { label: 'Kündigung', requiredFields: ['tenant_id', 'contract_id'] }
};

const CHANNELS = [
  { id: 'email', label: 'Email' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'postal', label: 'Postalisch' },
  { id: 'in_app', label: 'In-App' }
];

export default function DocumentAutogeneratorEnhanced({ isOpen, onClose, voiceResult }) {
  const [docType, setDocType] = useState(voiceResult?.document_type || '');
  const [formData, setFormData] = useState({
    tenant_id: voiceResult?.tenant_id || '',
    unit_id: voiceResult?.unit_id || '',
    contract_id: voiceResult?.contract_id || '',
    building_id: voiceResult?.building_id || '',
    distribution_channels: ['email']
  });

  // Fetch custom templates from DB
  const { data: customTemplates = [] } = useQuery({
    queryKey: ['customTemplates', docType],
    queryFn: () => base44.entities.DocumentTemplate.filter({ document_type: docType, is_active: true }),
    enabled: !!docType
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list('-updated_date', 100)
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list('-updated_date', 100)
  });

  const generateMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('generateDocument', {
        document_type: docType,
        tenant_id: formData.tenant_id,
        unit_id: formData.unit_id,
        contract_id: formData.contract_id,
        building_id: formData.building_id,
        distribution_channels: formData.distribution_channels,
        document_data: data
      });
    },
    onSuccess: () => {
      toast.success('Dokument erstellt und versendet!');
      onClose();
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    }
  });

  const missingFields = DOCUMENT_TYPES[docType]?.requiredFields?.filter(
    f => !formData[f]
  ) || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (missingFields.length > 0) {
      toast.error(`Erforderliche Felder: ${missingFields.join(', ')}`);
      return;
    }
    
    // Auto-fetch data for tenant/unit if available
    const tenantData = tenants.find(t => t.id === formData.tenant_id) || {};
    const unitData = units.find(u => u.id === formData.unit_id) || {};

    generateMutation.mutate({
      tenant_first_name: tenantData.first_name || '',
      tenant_last_name: tenantData.last_name || '',
      tenant_email: tenantData.email || '',
      unit_number: unitData.unit_number || '',
      ...formData
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dokument generieren</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Dokumenttyp</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger>
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Templates Info */}
          {customTemplates.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              {customTemplates.length} eigene Template(s) verfügbar
            </div>
          )}

          {missingFields.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded flex gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800">{missingFields.join(', ')}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mieter</Label>
              <Select value={formData.tenant_id} onValueChange={(val) => setFormData({...formData, tenant_id: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Wohnung</Label>
              <Select value={formData.unit_id} onValueChange={(val) => setFormData({...formData, unit_id: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {units.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.unit_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Versandkanäle</Label>
            <div className="flex gap-4 mt-2">
              {CHANNELS.map(ch => (
                <label key={ch.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.distribution_channels.includes(ch.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({...formData, distribution_channels: [...formData.distribution_channels, ch.id]});
                      } else {
                        setFormData({...formData, distribution_channels: formData.distribution_channels.filter(c => c !== ch.id)});
                      }
                    }}
                  />
                  <span className="text-sm">{ch.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button type="submit" disabled={generateMutation.isPending || missingFields.length > 0} className="flex-1">
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Erstelle...
                </>
              ) : (
                'Erstellen & Versenden'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}