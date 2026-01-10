import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailDigestSettings() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['emailDigest'],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreference.list(null, 1);
      return prefs[0] || { email_digest_frequency: 'daily' };
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (frequency) => {
      await base44.functions.invoke('saveEmailDigestSettings', { frequency });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailDigest'] });
      toast.success('Einstellungen gespeichert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          E-Mail-Zusammenfassung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select 
          value={settings?.email_digest_frequency || 'daily'}
          onValueChange={(val) => updateMutation.mutate(val)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="realtime">Sofort</SelectItem>
            <SelectItem value="daily">Täglich</SelectItem>
            <SelectItem value="weekly">Wöchentlich</SelectItem>
            <SelectItem value="never">Nie</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}