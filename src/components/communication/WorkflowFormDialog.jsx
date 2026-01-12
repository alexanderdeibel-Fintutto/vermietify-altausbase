import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

const PLACEHOLDERS = {
  tenant: ['{{mieter_vorname}}', '{{mieter_nachname}}', '{{mieter_anrede}}'],
  contract: ['{{mietbeginn}}', '{{kaltmiete}}', '{{warmmiete}}', '{{faelligkeitstag}}'],
  building: ['{{gebaeude_name}}', '{{gebaeude_adresse}}'],
  dates: ['{{heute}}', '{{faellig_am}}', '{{vertragsende}}']
};

export default function WorkflowFormDialog({ open, onClose, workflow }) {
  const [formData, setFormData] = useState({
    name: '',
    workflow_type: 'Mietzahlungserinnerung',
    trigger_type: 'Fälligkeitsdatum',
    trigger_offset_days: -3,
    email_betreff: '',
    email_text: '',
    ist_aktiv: true
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (workflow) {
      setFormData(workflow);
    } else {
      loadTemplate('Mietzahlungserinnerung');
    }
  }, [workflow, open]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (workflow?.id) {
        return base44.entities.CommunicationWorkflow.update(workflow.id, data);
      }
      return base44.entities.CommunicationWorkflow.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communicationWorkflows']);
      toast.success(workflow ? 'Workflow aktualisiert' : 'Workflow erstellt');
      onClose();
    }
  });

  const loadTemplate = (type) => {
    const templates = {
      'Mietzahlungserinnerung': {
        name: 'Zahlungserinnerung',
        email_betreff: 'Erinnerung: Mietzahlung fällig',
        email_text: `Sehr geehrte/r {{mieter_anrede}} {{mieter_nachname}},

dies ist eine freundliche Erinnerung, dass Ihre Miete für {{gebaeude_name}} am {{faellig_am}} fällig ist.

Betrag: {{warmmiete}} EUR
Verwendungszweck: Miete {{gebaeude_name}}

Bitte überweisen Sie den Betrag rechtzeitig.

Mit freundlichen Grüßen`
      },
      'Vertragsverlängerung': {
        name: 'Vertragsverlängerung',
        email_betreff: 'Ihr Mietvertrag läuft aus',
        email_text: `Sehr geehrte/r {{mieter_anrede}} {{mieter_nachname}},

Ihr Mietvertrag für {{gebaeude_name}} läuft am {{vertragsende}} aus.

Wir würden uns freuen, wenn Sie weiterhin unser Mieter bleiben. Bitte teilen Sie uns zeitnah mit, ob Sie den Vertrag verlängern möchten.

Mit freundlichen Grüßen`
      },
      'Wartungsanfrage': {
        name: 'Wartungsanfrage-Bestätigung',
        email_betreff: 'Ihre Wartungsanfrage wurde erhalten',
        email_text: `Sehr geehrte/r {{mieter_anrede}} {{mieter_nachname}},

vielen Dank für Ihre Wartungsanfrage. Wir haben diese erhalten und werden uns zeitnah darum kümmern.

Objekt: {{gebaeude_name}}

Wir informieren Sie über den Fortschritt.

Mit freundlichen Grüßen`
      }
    };

    const template = templates[type];
    if (template) {
      setFormData(prev => ({ ...prev, ...template, workflow_type: type }));
    }
  };

  const insertPlaceholder = (placeholder) => {
    setFormData(prev => ({
      ...prev,
      email_text: prev.email_text + ' ' + placeholder
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workflow ? 'Workflow bearbeiten' : 'Neuer Workflow'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Zahlungserinnerung 3 Tage vorher"
              />
            </div>
            <div>
              <Label>Workflow-Typ *</Label>
              <Select 
                value={formData.workflow_type} 
                onValueChange={v => { setFormData({...formData, workflow_type: v}); loadTemplate(v); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mietzahlungserinnerung">Mietzahlungserinnerung</SelectItem>
                  <SelectItem value="Vertragsverlängerung">Vertragsverlängerung</SelectItem>
                  <SelectItem value="Wartungsanfrage">Wartungsanfrage</SelectItem>
                  <SelectItem value="Betriebskostenabrechnung">Betriebskostenabrechnung</SelectItem>
                  <SelectItem value="Benutzerdefiniert">Benutzerdefiniert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Trigger *</Label>
              <Select value={formData.trigger_type} onValueChange={v => setFormData({...formData, trigger_type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fälligkeitsdatum">Fälligkeitsdatum</SelectItem>
                  <SelectItem value="Vertragsdatum">Vertragsdatum</SelectItem>
                  <SelectItem value="Status-Änderung">Status-Änderung</SelectItem>
                  <SelectItem value="Zeitgesteuert">Zeitgesteuert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tage vorher/nachher</Label>
              <Input
                type="number"
                value={formData.trigger_offset_days}
                onChange={e => setFormData({...formData, trigger_offset_days: parseInt(e.target.value)})}
              />
              <p className="text-xs text-slate-500 mt-1">Negativ = vorher, Positiv = nachher</p>
            </div>
          </div>

          <div>
            <Label>E-Mail-Betreff *</Label>
            <Input
              value={formData.email_betreff}
              onChange={e => setFormData({...formData, email_betreff: e.target.value})}
              placeholder="Erinnerung: Mietzahlung fällig"
            />
          </div>

          <div>
            <Label>E-Mail-Text *</Label>
            <Textarea
              value={formData.email_text}
              onChange={e => setFormData({...formData, email_text: e.target.value})}
              rows={10}
              placeholder="Nachrichtentext..."
            />
          </div>

          {/* Placeholders */}
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs font-medium text-slate-700 mb-2">Verfügbare Platzhalter:</p>
            <div className="flex flex-wrap gap-1">
              {Object.values(PLACEHOLDERS).flat().map(ph => (
                <Badge
                  key={ph}
                  variant="outline"
                  className="cursor-pointer hover:bg-slate-200 text-xs"
                  onClick={() => insertPlaceholder(ph)}
                >
                  {ph}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button 
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending || !formData.name || !formData.email_betreff || !formData.email_text}
            >
              {saveMutation.isPending ? 'Speichert...' : 'Speichern'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}