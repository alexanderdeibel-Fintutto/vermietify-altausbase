import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { Key, Plus, Copy, Trash2 } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function APIKeyManager() {
  const [keys, setKeys] = useState([
    { id: 1, name: 'Production API', key: 'sk_live_xxxxx...', created: '2026-01-10' }
  ]);

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    showSuccess('API-Schlüssel kopiert');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API-Schlüssel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Neuer API-Schlüssel
          </Button>

          <div className="space-y-2">
            {keys.map((apiKey) => (
              <div key={apiKey.id} className="flex items-center justify-between p-3 bg-[var(--theme-surface)] rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{apiKey.name}</div>
                  <div className="font-mono text-xs text-[var(--theme-text-muted)] mt-1">{apiKey.key}</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => copyKey(apiKey.key)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-[var(--vf-error-500)]" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}