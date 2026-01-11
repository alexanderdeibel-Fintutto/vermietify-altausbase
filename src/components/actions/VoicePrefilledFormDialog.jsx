import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function VoicePrefilledFormDialog({ isOpen, onClose, result }) {
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (result?.data) {
      setFormData(result.data);
    }
  }, [result]);

  const createEntityMutation = useMutation({
    mutationFn: async (data) => {
      const intent = result.intent;
      
      if (intent === 'CreateLeaseContract') {
        return await base44.entities.LeaseContract.create(data);
      } else if (intent === 'CreateHandoverProtocol') {
        return await base44.entities.HandoverProtocol.create(data);
      } else if (intent === 'CreateTask' || intent === 'CreateNote') {
        return await base44.entities.Task.create(data);
      } else if (intent === 'CreateMaintenanceTask') {
        return await base44.entities.MaintenanceTask.create(data);
      } else if (intent === 'CreateFieldTask') {
        return await base44.entities.FieldTask.create(data);
      }
      
      throw new Error('Unbekannter Intent');
    },
    onSuccess: () => {
      toast.success('Erfolgreich erstellt!');
      queryClient.invalidateQueries();
      onClose();
    },
    onError: (error) => {
      toast.error('Fehler beim Erstellen: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createEntityMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!result) return null;

  const isMissingField = (field) => {
    return result.missingFields?.includes(field) && !formData[field];
  };

  const getTitle = () => {
    switch(result.intent) {
      case 'CreateLeaseContract': return 'Mietvertrag erstellen';
      case 'CreateHandoverProtocol': return 'Übergabeprotokoll erstellen';
      case 'CreateTask': return 'Aufgabe erstellen';
      case 'CreateNote': return 'Notiz erstellen';
      case 'CreateMaintenanceTask': return 'Wartungsaufgabe erstellen';
      case 'CreateFieldTask': return 'Vor-Ort Aufgabe erstellen';
      case 'CreateOffer': return 'Angebot erstellen';
      default: return 'Formular';
    }
  };

  const renderForm = () => {
    const { intent } = result;

    if (intent === 'CreateFieldTask') {
      return (
        <div className="space-y-4">
          <div>
            <Label>Aufgabentitel</Label>
            <Input
              value={formData.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Titel"
            />
          </div>

          <div>
            <Label>Beschreibung</Label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Details..."
              rows={3}
            />
          </div>

          {formData.task_category === 'objekt_zaehler' && (
            <div>
              <Label className={cn(isMissingField('meter_reading.reading_value') && 'text-orange-600')}>
                Zählerstand {isMissingField('meter_reading.reading_value') && <AlertCircle className="inline w-4 h-4 ml-1" />}
              </Label>
              <Input
                type="number"
                step="0.001"
                value={formData.meter_reading?.reading_value || ''}
                onChange={(e) => handleChange('meter_reading', { 
                  ...formData.meter_reading, 
                  reading_value: parseFloat(e.target.value),
                  reading_date: new Date().toISOString()
                })}
                placeholder="Zählerstand"
                className={cn(isMissingField('meter_reading.reading_value') && 'border-orange-400 bg-orange-50')}
              />
            </div>
          )}

          {formData.task_category === 'objekt_technik' && (
            <div>
              <Label>Prüfungsergebnis</Label>
              <Select 
                value={formData.inspection_data?.result || ''} 
                onValueChange={(val) => handleChange('inspection_data', {
                  ...formData.inspection_data,
                  result: val,
                  inspection_type: formData.task_type
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ergebnis wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passed">In Ordnung</SelectItem>
                  <SelectItem value="needs_attention">Mängel festgestellt</SelectItem>
                  <SelectItem value="failed">Nicht bestanden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Priorität</Label>
            <Select value={formData.priority || 'normal'} onValueChange={(val) => handleChange('priority', val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="niedrig">Niedrig</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="hoch">Hoch</SelectItem>
                <SelectItem value="sofort">Sofort</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    if (intent === 'CreateLeaseContract') {
      return (
        <div className="space-y-4">
          <div>
            <Label className={cn(isMissingField('tenant_id') && 'text-orange-600')}>
              Mieter {isMissingField('tenant_id') && <AlertCircle className="inline w-4 h-4 ml-1" />}
            </Label>
            <Input
              value={formData.tenantName || ''}
              onChange={(e) => handleChange('tenantName', e.target.value)}
              placeholder="Name des Mieters"
              className={cn(isMissingField('tenant_id') && 'border-orange-400 bg-orange-50')}
            />
            {formData.tenant_id && <CheckCircle2 className="text-green-600 w-4 h-4 mt-1" />}
          </div>

          <div>
            <Label className={cn(isMissingField('unit_id') && 'text-orange-600')}>
              Wohnung {isMissingField('unit_id') && <AlertCircle className="inline w-4 h-4 ml-1" />}
            </Label>
            <Input
              value={formData.unitNumber || ''}
              onChange={(e) => handleChange('unitNumber', e.target.value)}
              placeholder="Wohnungsnummer"
              className={cn(isMissingField('unit_id') && 'border-orange-400 bg-orange-50')}
            />
          </div>

          <div>
            <Label className={cn(isMissingField('start_date') && 'text-orange-600')}>
              Mietbeginn {isMissingField('start_date') && <AlertCircle className="inline w-4 h-4 ml-1" />}
            </Label>
            <Input
              type="date"
              value={formData.start_date || ''}
              onChange={(e) => handleChange('start_date', e.target.value)}
              className={cn(isMissingField('start_date') && 'border-orange-400 bg-orange-50')}
            />
          </div>

          <div>
            <Label className={cn(isMissingField('base_rent') && 'text-orange-600')}>
              Kaltmiete (€) {isMissingField('base_rent') && <AlertCircle className="inline w-4 h-4 ml-1" />}
            </Label>
            <Input
              type="number"
              value={formData.base_rent || ''}
              onChange={(e) => handleChange('base_rent', parseFloat(e.target.value))}
              placeholder="z.B. 850"
              className={cn(isMissingField('base_rent') && 'border-orange-400 bg-orange-50')}
            />
          </div>

          <div>
            <Label className={cn(isMissingField('total_rent') && 'text-orange-600')}>
              Warmmiete (€) {isMissingField('total_rent') && <AlertCircle className="inline w-4 h-4 ml-1" />}
            </Label>
            <Input
              type="number"
              value={formData.total_rent || ''}
              onChange={(e) => handleChange('total_rent', parseFloat(e.target.value))}
              placeholder="z.B. 1050"
              className={cn(isMissingField('total_rent') && 'border-orange-400 bg-orange-50')}
            />
          </div>
        </div>
      );
    }

    if (intent === 'CreateHandoverProtocol') {
      return (
        <div className="space-y-4">
          <div>
            <Label className={cn(isMissingField('unit_id') && 'text-orange-600')}>
              Wohnung {isMissingField('unit_id') && <AlertCircle className="inline w-4 h-4 ml-1" />}
            </Label>
            <Input
              value={formData.unitNumber || ''}
              onChange={(e) => handleChange('unitNumber', e.target.value)}
              placeholder="Wohnungsnummer"
              className={cn(isMissingField('unit_id') && 'border-orange-400 bg-orange-50')}
            />
          </div>

          <div>
            <Label className={cn(isMissingField('protocol_type') && 'text-orange-600')}>
              Typ {isMissingField('protocol_type') && <AlertCircle className="inline w-4 h-4 ml-1" />}
            </Label>
            <Select value={formData.protocolType || formData.protocol_type || ''} onValueChange={(val) => {
              handleChange('protocolType', val);
              handleChange('protocol_type', val);
            }}>
              <SelectTrigger className={cn(isMissingField('protocol_type') && 'border-orange-400 bg-orange-50')}>
                <SelectValue placeholder="Protokolltyp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="move_in">Einzug</SelectItem>
                <SelectItem value="move_out">Auszug</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Protokolldatum</Label>
            <Input
              type="date"
              value={formData.protocol_date || ''}
              onChange={(e) => handleChange('protocol_date', e.target.value)}
            />
          </div>
        </div>
      );
    }

    if (intent === 'CreateTask' || intent === 'CreateNote') {
      return (
        <div className="space-y-4">
          <div>
            <Label>Titel</Label>
            <Input
              value={formData.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Aufgabentitel"
            />
          </div>

          <div>
            <Label>Beschreibung</Label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Details..."
              rows={4}
            />
          </div>

          <div>
            <Label>Status</Label>
            <Select value={formData.status || 'offen'} onValueChange={(val) => handleChange('status', val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="offen">Offen</SelectItem>
                <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                <SelectItem value="erledigt">Erledigt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Fälligkeitsdatum</Label>
            <Input
              type="date"
              value={formData.due_date || ''}
              onChange={(e) => handleChange('due_date', e.target.value)}
            />
          </div>
        </div>
      );
    }

    if (intent === 'CreateMaintenanceTask') {
      return (
        <div className="space-y-4">
          <div>
            <Label className={cn(isMissingField('title') && 'text-orange-600')}>
              Titel {isMissingField('title') && <AlertCircle className="inline w-4 h-4 ml-1" />}
            </Label>
            <Input
              value={formData.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Problem-Beschreibung"
              className={cn(isMissingField('title') && 'border-orange-400 bg-orange-50')}
            />
          </div>

          <div>
            <Label>Beschreibung</Label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Details zum Problem"
              rows={3}
            />
          </div>

          <div>
            <Label className={cn(isMissingField('category') && 'text-orange-600')}>
              Kategorie {isMissingField('category') && <AlertCircle className="inline w-4 h-4 ml-1" />}
            </Label>
            <Select value={formData.category || ''} onValueChange={(val) => handleChange('category', val)}>
              <SelectTrigger className={cn(isMissingField('category') && 'border-orange-400 bg-orange-50')}>
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plumbing">Sanitär</SelectItem>
                <SelectItem value="electrical">Elektrik</SelectItem>
                <SelectItem value="heating">Heizung</SelectItem>
                <SelectItem value="general">Allgemein</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Priorität</Label>
            <Select value={formData.priority || 'medium'} onValueChange={(val) => handleChange('priority', val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Niedrig</SelectItem>
                <SelectItem value="medium">Mittel</SelectItem>
                <SelectItem value="high">Hoch</SelectItem>
                <SelectItem value="urgent">Dringend</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 bg-slate-50 rounded-lg">
        <p className="text-sm text-slate-600">
          Für diesen Intent gibt es noch kein Formular.
        </p>
      </div>
    );
  };

  const hasMissingFields = result?.missingFields && result.missingFields.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          {hasMissingFields && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg mt-2">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-900">Fehlende Pflichtfelder</p>
                <p className="text-orange-700">Bitte füllen Sie die orange markierten Felder aus.</p>
              </div>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4">
          {renderForm()}

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={createEntityMutation.isPending}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={createEntityMutation.isPending}>
              {createEntityMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Erstelle...
                </>
              ) : (
                'Erstellen'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}