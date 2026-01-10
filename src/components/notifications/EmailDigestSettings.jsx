import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailDigestSettings() {
  const [frequency, setFrequency] = React.useState('weekly');
  const [enabled, setEnabled] = React.useState(true);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('saveEmailDigestSettings', { frequency, enabled });
    },
    onSuccess: () => {
      toast.success('Einstellungen gespeichert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email-Zusammenfassung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Aktiviert</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <Select value={frequency} onValueChange={setFrequency}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Täglich</SelectItem>
            <SelectItem value="weekly">Wöchentlich</SelectItem>
            <SelectItem value="monthly">Monatlich</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}