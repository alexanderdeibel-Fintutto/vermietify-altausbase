import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { Key, Copy, Plus } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function APIKeyManager() {
  const [keys, setKeys] = useState([
    { id: '1', name: 'Production API', key: 'sk_live_xxxxxxxxxxxxx', created: new Date() }
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
        <div className="space-y-3 mb-4">
          {keys.map((apiKey) => (
            <div key={apiKey.id} className="flex items-center gap-2 p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-sm">{apiKey.name}</div>
                <code className="text-xs text-[var(--theme-text-muted)]">{apiKey.key}</code>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyKey(apiKey.key)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button variant="gradient" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Neuer API-Schlüssel
        </Button>
      </CardContent>
    </Card>
  );
}