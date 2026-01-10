import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export default function TwoFactorAuth() {
  const [code, setCode] = useState('');
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['2faSettings'],
    queryFn: async () => {
      const response = await base44.functions.invoke('get2FASettings', {});
      return response.data;
    }
  });

  const enableMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('enable2FA', {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['2faSettings'] });
      toast.success('2FA aktiviert');
    }
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('verify2FA', { code });
    },
    onSuccess: () => {
      toast.success('Code verifiziert');
      setCode('');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Zwei-Faktor-Authentifizierung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">2FA aktiviert</span>
          <Switch
            checked={settings?.enabled}
            onCheckedChange={(checked) => checked && enableMutation.mutate()}
          />
        </div>

        {settings?.qr_code && (
          <div className="p-3 bg-slate-50 rounded-lg text-center">
            <img src={settings.qr_code} alt="QR Code" className="mx-auto mb-2" />
            <p className="text-xs text-slate-600">QR-Code mit Authenticator-App scannen</p>
          </div>
        )}

        {settings?.enabled && (
          <div className="flex gap-2">
            <Input
              placeholder="6-stelliger Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
            />
            <Button onClick={() => verifyMutation.mutate()} disabled={code.length !== 6}>
              Verifizieren
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}