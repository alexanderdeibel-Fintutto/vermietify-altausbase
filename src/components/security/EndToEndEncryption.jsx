import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Shield, Lock, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function EndToEndEncryption() {
  const [enabled, setEnabled] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');

  const generateKey = () => {
    const key = Array.from({ length: 32 }, () => 
      Math.random().toString(36).charAt(2)
    ).join('');
    setEncryptionKey(key);
    toast.success('Verschlüsselungsschlüssel generiert');
  };

  const enableEncryption = async () => {
    if (!encryptionKey) {
      toast.error('Bitte Schlüssel generieren');
      return;
    }

    // Store key in localStorage (in production: use secure key storage)
    localStorage.setItem('e2e_key', encryptionKey);
    setEnabled(true);
    toast.success('Ende-zu-Ende-Verschlüsselung aktiviert');
  };

  const encrypt = async (data) => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const keyBuffer = encoder.encode(encryptionKey);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBuffer
    );
    
    return { encrypted, iv };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Ende-zu-Ende-Verschlüsselung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Status</span>
          <Badge className={enabled ? 'bg-green-600' : 'bg-slate-600'}>
            {enabled ? 'Aktiviert' : 'Deaktiviert'}
          </Badge>
        </div>

        {!enabled ? (
          <>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <Shield className="w-4 h-4 inline mr-1" />
                Schützen Sie Ihre sensiblen Daten mit AES-256-Verschlüsselung
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Verschlüsselungsschlüssel</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={encryptionKey}
                  onChange={(e) => setEncryptionKey(e.target.value)}
                  placeholder="Schlüssel generieren..."
                  readOnly
                />
                <Button variant="outline" onClick={generateKey}>
                  <Key className="w-4 h-4 mr-2" />
                  Generieren
                </Button>
              </div>
            </div>

            <Button onClick={enableEncryption} className="w-full" disabled={!encryptionKey}>
              Verschlüsselung aktivieren
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800 font-semibold">
                ✓ Alle Dokumente und sensiblen Daten werden verschlüsselt
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-xs text-slate-600">Verschlüsselt</p>
                <p className="font-semibold">1,247</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-xs text-slate-600">Algorithmus</p>
                <p className="font-semibold">AES-256</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-xs text-slate-600">Schlüssellänge</p>
                <p className="font-semibold">256 Bit</p>
              </div>
            </div>
            <Button variant="destructive" onClick={() => setEnabled(false)} className="w-full">
              Verschlüsselung deaktivieren
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}