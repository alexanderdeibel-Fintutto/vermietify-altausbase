import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AutomationScheduler({ buildingId }) {
  const [formType, setFormType] = useState('');
  const [frequency, setFrequency] = useState('yearly');
  const [saving, setSaving] = useState(false);

  const scheduleAutomation = async () => {
    if (!formType) {
      toast.error('Bitte Formulartyp auswählen');
      return;
    }

    setSaving(true);
    try {
      const response = await base44.functions.invoke('scheduleAutomatedSubmission', {
        building_id: buildingId,
        form_type: formType,
        schedule_config: {
          frequency,
          day: frequency === 'monthly' ? 1 : undefined,
          month: frequency === 'yearly' ? 6 : undefined
        }
      });

      if (response.data.success) {
        toast.success('Automatisierung eingerichtet');
      }
    } catch (error) {
      toast.error('Einrichtung fehlgeschlagen');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Automatisierung planen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Formulartyp</Label>
          <Select value={formType} onValueChange={setFormType}>
            <SelectTrigger>
              <SelectValue placeholder="Typ wählen..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANLAGE_V">Anlage V</SelectItem>
              <SelectItem value="EUER">EÜR</SelectItem>
              <SelectItem value="GEWERBESTEUER">Gewerbesteuer</SelectItem>
              <SelectItem value="UMSATZSTEUER">Umsatzsteuer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Häufigkeit</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monatlich</SelectItem>
              <SelectItem value="quarterly">Quartalsweise</SelectItem>
              <SelectItem value="yearly">Jährlich</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={scheduleAutomation} disabled={saving} className="w-full">
          <Calendar className="w-4 h-4 mr-2" />
          {saving ? 'Speichere...' : 'Automatisierung einrichten'}
        </Button>
      </CardContent>
    </Card>
  );
}