import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const DOCUMENT_TYPES = {
  mietvertrag: { label: 'Mietvertrag', requiredFields: ['tenant_id', 'unit_id', 'start_date', 'base_rent'] },
  uebergabeprotokoll_einzug: { label: 'Übergabeprotokoll (Einzug)', requiredFields: ['tenant_id', 'unit_id'] },
  uebergabeprotokoll_auszug: { label: 'Übergabeprotokoll (Auszug)', requiredFields: ['tenant_id', 'unit_id'] },
  mietangebot: { label: 'Mietangebot', requiredFields: ['tenant_id', 'unit_id', 'offered_rent'] },
  sepa_mandat: { label: 'SEPA-Lastschriftmandat', requiredFields: ['tenant_id', 'contract_id'] },
  zahlungserinnerung: { label: 'Zahlungserinnerung', requiredFields: ['tenant_id', 'contract_id', 'amount'] },
  mahnung: { label: 'Mahnung', requiredFields: ['tenant_id', 'contract_id', 'amount', 'mahnung_stufe'] },
  abmahnung: { label: 'Abmahnung', requiredFields: ['tenant_id', 'contract_id', 'reason'] },
  kuendigung: { label: 'Kündigung', requiredFields: ['tenant_id', 'contract_id', 'termination_date'] },
  betriebskostenabrechnung: { label: 'Betriebskostenabrechnung', requiredFields: ['tenant_id', 'contract_id', 'abrechnungsjahr'] },
  mieterhoehung: { label: 'Mieterhöhungsverlangen', requiredFields: ['tenant_id', 'contract_id', 'new_rent'] },
  wohnungsgeberbestaetigung: { label: 'Wohnungsgeberbestätigung', requiredFields: ['tenant_id', 'unit_id'] },
  schadensanzeige: { label: 'Schadensanzeige/Mängelanzeige', requiredFields: ['tenant_id', 'unit_id', 'damage_description'] },
  auftragserteilung: { label: 'Auftragserteilung Handwerker', requiredFields: ['vendor_id', 'work_description', 'estimated_cost'] },
  kautionsquittung: { label: 'Kautionsquittung/-abrechnung', requiredFields: ['tenant_id', 'contract_id', 'deposit_amount'] }
};

const CHANNELS = [
  { id: 'email', label: 'Email' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'postal', label: 'Postalisch' },
  { id: 'in_app', label: 'In-App' }
];

export default function DocumentAutogeneratorDialog({ isOpen, onClose, voiceResult }) {
  const [formData, setFormData] = useState({
    document_type: voiceResult?.document_type || '',
    tenant_id: voiceResult?.tenant_id || '',
    unit_id: voiceResult?.unit_id || '',
    contract_id: voiceResult?.contract_id || '',
    building_id: voiceResult?.building_id || '',
    distribution_channels: voiceResult?.distribution_channels || ['email'],
    additional_data: {}
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('documentOrchestrator', data);
    },
    onSuccess: (result) => {
      toast.success('Dokument erstellt und versendet!');
      console.log('Document orchestration result:', result);
      onClose();
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    }
  });

  const missingFields = DOCUMENT_TYPES[formData.document_type]?.requiredFields?.filter(
    f => !formData[f] && !formData.additional_data[f]
  ) || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (missingFields.length > 0) {
      toast.error(`Erforderliche Felder: ${missingFields.join(', ')}`);
      return;
    }
    generateMutation.mutate({
      ...formData,
      document_data: {
        ...formData.additional_data,
        tenant_id: formData.tenant_id,
        unit_id: formData.unit_id,
        contract_id: formData.contract_id,
        building_id: formData.building_id
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dokument generieren und versenden</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Dokumenttyp */}
          <div>
            <Label>Dokumenttyp</Label>
            <Select value={formData.document_type} onValueChange={(val) => setFormData({...formData, document_type: val})}>
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

          {/* Pflichtfelder */}
          {missingFields.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-yellow-800">Erforderliche Felder:</p>
                <p className="text-xs text-yellow-700">{missingFields.join(', ')}</p>
              </div>
            </div>
          )}

          {/* Grunddaten */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mieter-ID</Label>
              <Input 
                value={formData.tenant_id} 
                onChange={(e) => setFormData({...formData, tenant_id: e.target.value})}
                placeholder="Mieter wählen..."
              />
            </div>
            <div>
              <Label>Wohnungs-ID</Label>
              <Input 
                value={formData.unit_id} 
                onChange={(e) => setFormData({...formData, unit_id: e.target.value})}
                placeholder="Wohnung wählen..."
              />
            </div>
            <div>
              <Label>Vertrags-ID</Label>
              <Input 
                value={formData.contract_id} 
                onChange={(e) => setFormData({...formData, contract_id: e.target.value})}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label>Gebäude-ID</Label>
              <Input 
                value={formData.building_id} 
                onChange={(e) => setFormData({...formData, building_id: e.target.value})}
                placeholder="Gebäude wählen..."
              />
            </div>
          </div>

          {/* Versandkanäle */}
          <div>
            <Label>Versandkanäle</Label>
            <div className="space-y-2">
              {CHANNELS.map(ch => (
                <div key={ch.id} className="flex items-center">
                  <Checkbox 
                    id={ch.id}
                    checked={formData.distribution_channels.includes(ch.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          distribution_channels: [...formData.distribution_channels, ch.id]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          distribution_channels: formData.distribution_channels.filter(c => c !== ch.id)
                        });
                      }
                    }}
                  />
                  <label htmlFor={ch.id} className="ml-2 text-sm cursor-pointer">{ch.label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Erweiterte Optionen */}
          <div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full"
            >
              {showAdvanced ? 'Weniger' : 'Mehr'} Optionen
            </Button>
            {showAdvanced && (
              <div className="mt-3 p-3 border rounded-lg space-y-3">
                <Textarea 
                  placeholder="Zusätzliche Daten als JSON..."
                  defaultValue="{}"
                  onChange={(e) => {
                    try {
                      setFormData({...formData, additional_data: JSON.parse(e.target.value)});
                    } catch (e) {}
                  }}
                  className="font-mono text-xs"
                  rows={4}
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button 
              type="submit" 
              disabled={generateMutation.isPending || missingFields.length > 0} 
              className="flex-1"
            >
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