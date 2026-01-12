import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from 'sonner';
import { Save, AlertCircle, CheckCircle, Percent, Calendar, FileText } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";

export default function BuildingOwnershipDialog({ 
  open, 
  onOpenChange, 
  buildingId, 
  ownership = null, 
  selectedOwnerId = null,
  currentTotal = 0,
  onSuccess 
}) {
  const [formData, setFormData] = useState({
    building_id: buildingId,
    owner_id: selectedOwnerId || '',
    anteil_prozent: 0,
    gueltig_von: new Date().toISOString().split('T')[0],
    ist_aktiv: true
  });
  const [saving, setSaving] = useState(false);

  // Load existing data when editing
  useEffect(() => {
    if (ownership) {
      setFormData({
        building_id: ownership.building_id,
        owner_id: ownership.owner_id,
        anteil_prozent: ownership.anteil_prozent,
        anteil_bruch_zaehler: ownership.anteil_bruch_zaehler,
        anteil_bruch_nenner: ownership.anteil_bruch_nenner,
        gueltig_von: ownership.gueltig_von,
        gueltig_bis: ownership.gueltig_bis,
        grund_aenderung: ownership.grund_aenderung,
        notarvertrag_nummer: ownership.notarvertrag_nummer,
        notarvertrag_datum: ownership.notarvertrag_datum,
        grundbuch_eintragung: ownership.grundbuch_eintragung,
        bemerkungen: ownership.bemerkungen,
        ist_aktiv: ownership.ist_aktiv
      });
    } else if (selectedOwnerId) {
      setFormData(prev => ({ ...prev, owner_id: selectedOwnerId }));
    }
  }, [ownership, selectedOwnerId]);

  // Fetch owners
  const { data: owners = [] } = useQuery({
    queryKey: ['owners'],
    queryFn: () => base44.entities.Owner.filter({ aktiv: true })
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validations
      if (!formData.owner_id) {
        toast.error('Bitte wählen Sie einen Eigentümer');
        setSaving(false);
        return;
      }

      if (!formData.anteil_prozent || formData.anteil_prozent <= 0) {
        toast.error('Anteil muss größer als 0% sein');
        setSaving(false);
        return;
      }

      // Check total would not exceed 100%
      const newTotal = currentTotal + parseFloat(formData.anteil_prozent);
      if (newTotal > 100.01) {
        toast.error(`Gesamtanteil würde ${newTotal.toFixed(2)}% betragen (max. 100%)`);
        setSaving(false);
        return;
      }

      if (ownership) {
        await base44.entities.BuildingOwnership.update(ownership.id, formData);
        toast.success('Eigentümeranteil aktualisiert');
      } else {
        await base44.entities.BuildingOwnership.create(formData);
        toast.success('Eigentümeranteil hinzugefügt');
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const remainingPercent = 100 - currentTotal;
  const wouldExceed = currentTotal + parseFloat(formData.anteil_prozent || 0) > 100.01;

  const getOwnerName = (ownerId) => {
    const owner = owners.find(o => o.id === ownerId);
    if (!owner) return '';
    if (owner.eigentuemer_typ === 'natuerliche_person') {
      return `${owner.vorname || ''} ${owner.nachname}`.trim();
    }
    return owner.nachname + (owner.firma_zusatz ? ` ${owner.firma_zusatz}` : '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {ownership ? 'Eigentümeranteil bearbeiten' : 'Eigentümeranteil hinzufügen'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Info */}
          <Alert className={wouldExceed ? 'border-red-300 bg-red-50' : remainingPercent < 0.01 ? 'border-emerald-300 bg-emerald-50' : 'border-yellow-300 bg-yellow-50'}>
            <AlertDescription className="flex items-center gap-2">
              {wouldExceed ? (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-900">
                    Achtung: Gesamtanteil würde {(currentTotal + parseFloat(formData.anteil_prozent || 0)).toFixed(2)}% betragen (max. 100%)
                  </span>
                </>
              ) : remainingPercent < 0.01 ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-900">Alle Anteile sind vergeben (100%)</span>
                </>
              ) : (
                <>
                  <Percent className="w-4 h-4 text-yellow-600" />
                  <span className="text-yellow-900">
                    Noch {remainingPercent.toFixed(2)}% verfügbar
                  </span>
                </>
              )}
            </AlertDescription>
          </Alert>

          {/* Owner Selection */}
          <div className="space-y-2">
            <Label>Eigentümer *</Label>
            <Select 
              value={formData.owner_id} 
              onValueChange={(v) => updateField('owner_id', v)}
              disabled={!!selectedOwnerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Eigentümer auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {owners.map(owner => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {getOwnerName(owner.id)}
                    {owner.ort && ` • ${owner.ort}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ownership Percentage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Anteil in % *</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100"
                  value={formData.anteil_prozent || ''}
                  onChange={(e) => updateField('anteil_prozent', parseFloat(e.target.value))}
                  required
                  className="pr-8"
                />
                <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Empfehlung: {remainingPercent > 0 ? `${remainingPercent.toFixed(2)}%` : 'Bereits 100% vergeben'}
              </p>
            </div>

            <div>
              <Label>Oder als Bruch</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Zähler"
                  value={formData.anteil_bruch_zaehler || ''}
                  onChange={(e) => {
                    const zaehler = parseInt(e.target.value);
                    updateField('anteil_bruch_zaehler', zaehler);
                    if (zaehler && formData.anteil_bruch_nenner) {
                      updateField('anteil_prozent', (zaehler / formData.anteil_bruch_nenner * 100));
                    }
                  }}
                />
                <span className="text-slate-400">/</span>
                <Input
                  type="number"
                  placeholder="Nenner"
                  value={formData.anteil_bruch_nenner || ''}
                  onChange={(e) => {
                    const nenner = parseInt(e.target.value);
                    updateField('anteil_bruch_nenner', nenner);
                    if (formData.anteil_bruch_zaehler && nenner) {
                      updateField('anteil_prozent', (formData.anteil_bruch_zaehler / nenner * 100));
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Validity Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Gültig von *</Label>
              <Input
                type="date"
                value={formData.gueltig_von || ''}
                onChange={(e) => updateField('gueltig_von', e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Gültig bis</Label>
              <Input
                type="date"
                value={formData.gueltig_bis || ''}
                onChange={(e) => updateField('gueltig_bis', e.target.value)}
              />
            </div>
          </div>

          {/* Change Reason */}
          <div>
            <Label>Grund der Änderung</Label>
            <Select value={formData.grund_aenderung || ''} onValueChange={(v) => updateField('grund_aenderung', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kauf">Kauf</SelectItem>
                <SelectItem value="verkauf">Verkauf</SelectItem>
                <SelectItem value="erbschaft">Erbschaft</SelectItem>
                <SelectItem value="schenkung">Schenkung</SelectItem>
                <SelectItem value="sonstige">Sonstige</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notary Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Notarvertrag Nummer</Label>
              <Input
                value={formData.notarvertrag_nummer || ''}
                onChange={(e) => updateField('notarvertrag_nummer', e.target.value)}
                placeholder="NV-2024-12345"
              />
            </div>
            <div>
              <Label>Notarvertrag Datum</Label>
              <Input
                type="date"
                value={formData.notarvertrag_datum || ''}
                onChange={(e) => updateField('notarvertrag_datum', e.target.value)}
              />
            </div>
          </div>

          {/* Land Registry */}
          <div>
            <Label>Grundbucheintragung</Label>
            <Input
              type="date"
              value={formData.grundbuch_eintragung || ''}
              onChange={(e) => updateField('grundbuch_eintragung', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Bemerkungen</Label>
            <Textarea
              value={formData.bemerkungen || ''}
              onChange={(e) => updateField('bemerkungen', e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button 
              type="submit" 
              disabled={saving || wouldExceed} 
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? 'Speichere...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Speichern
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}