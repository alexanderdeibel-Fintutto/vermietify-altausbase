import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function TwoFactorAuth() {
  const [enabled, setEnabled] = useState(false);
  const [code, setCode] = useState('');

  const enable2FA = () => {
    if (code === '123456') {
      setEnabled(true);
      toast.success('2FA aktiviert');
    } else {
      toast.error('Falscher Code');
    }
  };

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
          <span className="text-sm">Status</span>
          <Badge className={enabled ? 'bg-green-600' : 'bg-slate-600'}>
            {enabled ? 'Aktiviert' : 'Deaktiviert'}
          </Badge>
        </div>
        {!enabled && (
          <>
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-sm font-semibold">QR-Code scannen</p>
              <div className="w-32 h-32 bg-white mx-auto mt-2 rounded flex items-center justify-center">
                <p className="text-xs text-slate-400">QR-Code</p>
              </div>
            </div>
            <Input 
              placeholder="6-stelliger Code" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
            />
            <Button onClick={enable2FA} className="w-full">
              2FA aktivieren
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}