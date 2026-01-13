import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

const GRUNDERWERBSTEUER_SAETZE = {
  'Baden-Württemberg': 5.0,
  'Bayern': 3.5,
  'Berlin': 6.0,
  'Brandenburg': 6.5,
  'Bremen': 5.0,
  'Hamburg': 5.5,
  'Hessen': 6.0,
  'Mecklenburg-Vorpommern': 6.0,
  'Niedersachsen': 5.0,
  'Nordrhein-Westfalen': 6.5,
  'Rheinland-Pfalz': 5.0,
  'Saarland': 6.5,
  'Sachsen': 5.5,
  'Sachsen-Anhalt': 5.0,
  'Schleswig-Holstein': 6.5,
  'Thüringen': 6.5
};

export default function PurchaseContractDialog({ open, onClose, buildingId, building, contract }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    building_id: buildingId,
    kaufdatum: '',
    eigentumsuebergang: '',
    kaufpreis_gesamt: '',
    grundstueckswert: '',
    notarkosten: '',
    grundbuchkosten: '',
    maklerkosten: '',
    grunderwerbsteuer_satz: building?.bundesland ? GRUNDERWERBSTEUER_SAETZE[building.bundesland] : 5.0,
    verkaeufer_name: '',
    notar_name: '',
    notarvertrag_nummer: '',
    bemerkungen: ''
  });

  useEffect(() => {
    if (contract) {
      setFormData(contract);
    } else if (building?.bundesland) {
      setFormData(prev => ({
        ...prev,
        grunderwerbsteuer_satz: GRUNDERWERBSTEUER_SAETZE[building.bundesland] || 5.0
      }));
    }
  }, [contract, building]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Berechnungen
      const gebaeudewert = data.kaufpreis_gesamt - data.grundstueckswert;
      const grunderwerbsteuer = data.kaufpreis_gesamt * (data.grunderwerbsteuer_satz / 100);
      const anschaffungsnebenkosten = (parseFloat(data.notarkosten) || 0) + 
                                      (parseFloat(data.grundbuchkosten) || 0) + 
                                      (parseFloat(data.maklerkosten) || 0) + 
                                      grunderwerbsteuer;
      const afa_bemessungsgrundlage = gebaeudewert + (anschaffungsnebenkosten * (gebaeudewert / data.kaufpreis_gesamt));
      
      let afa_satz = 2.0;
      if (building?.year_built < 1925) afa_satz = 2.5;
      if (building?.year_built >= 2023) afa_satz = 3.0;
      if (building?.denkmalschutz) afa_satz = 9.0;
      
      const afa_jahresbetrag = afa_bemessungsgrundlage * (afa_satz / 100);

      const fullData = {
        ...data,
        gebaeudewert,
        grunderwerbsteuer,
        anschaffungsnebenkosten,
        afa_bemessungsgrundlage,
        afa_satz,
        afa_jahresbetrag
      };

      if (contract?.id) {
        return base44.entities.PurchaseContract.update(contract.id, fullData);
      }
      return base44.entities.PurchaseContract.create(fullData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['purchaseContract', buildingId]);
      queryClient.invalidateQueries(['afaSchedule', buildingId]);
      toast.success('Kaufvertrag gespeichert');
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validierung
    if (parseFloat(formData.grundstueckswert) >= parseFloat(formData.kaufpreis_gesamt)) {
      toast.error('Grundstückswert muss kleiner als Kaufpreis sein!');
      return;
    }

    const grundstuecksanteil = (formData.grundstueckswert / formData.kaufpreis_gesamt) * 100;
    if (grundstuecksanteil < 15 || grundstuecksanteil > 40) {
      if (!confirm(`Grundstücksanteil liegt bei ${grundstuecksanteil.toFixed(1)}% (üblich: 15-40%). Trotzdem fortfahren?`)) {
        return;
      }
    }

    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contract ? 'Kaufvertrag bearbeiten' : 'Kaufvertrag erfassen'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Kaufdatum *</Label>
              <Input
                type="date"
                value={formData.kaufdatum}
                onChange={e => setFormData({...formData, kaufdatum: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Eigentumsübergang (Grundbuch) *</Label>
              <Input
                type="date"
                value={formData.eigentumsuebergang}
                onChange={e => setFormData({...formData, eigentumsuebergang: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Kaufpreis gesamt *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.kaufpreis_gesamt}
                onChange={e => setFormData({...formData, kaufpreis_gesamt: e.target.value})}
                required
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                Grundstückswert * 
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Der Grundstücksanteil wird NICHT abgeschrieben. Typisch: 20-30% des Kaufpreises. Ohne Trennung führt zu falscher AfA-Berechnung!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number"
                step="0.01"
                value={formData.grundstueckswert}
                onChange={e => setFormData({...formData, grundstueckswert: e.target.value})}
                required
              />
              <p className="text-xs text-slate-500 mt-1">Nicht abschreibbar!</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Notarkosten</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.notarkosten}
                onChange={e => setFormData({...formData, notarkosten: e.target.value})}
              />
            </div>
            <div>
              <Label>Grundbuchkosten</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.grundbuchkosten}
                onChange={e => setFormData({...formData, grundbuchkosten: e.target.value})}
              />
            </div>
            <div>
              <Label>Maklerkosten</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.maklerkosten}
                onChange={e => setFormData({...formData, maklerkosten: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Grunderwerbsteuer-Satz</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.grunderwerbsteuer_satz}
                onChange={e => setFormData({...formData, grunderwerbsteuer_satz: e.target.value})}
              />
              <p className="text-xs text-slate-500 mt-1">
                {building?.bundesland && `${building.bundesland}: ${GRUNDERWERBSTEUER_SAETZE[building.bundesland]}%`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Verkäufer</Label>
              <Input
                value={formData.verkaeufer_name}
                onChange={e => setFormData({...formData, verkaeufer_name: e.target.value})}
              />
            </div>
            <div>
              <Label>Notar</Label>
              <Input
                value={formData.notar_name}
                onChange={e => setFormData({...formData, notar_name: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label>Notarvertrag-Nummer</Label>
            <Input
              value={formData.notarvertrag_nummer}
              onChange={e => setFormData({...formData, notarvertrag_nummer: e.target.value})}
            />
          </div>

          <div>
            <Label>Bemerkungen</Label>
            <Textarea
              value={formData.bemerkungen}
              onChange={e => setFormData({...formData, bemerkungen: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}