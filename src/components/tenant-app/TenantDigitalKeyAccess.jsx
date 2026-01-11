import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Key, Smartphone, Clock, Lock, Unlock } from 'lucide-react';

export default function TenantDigitalKeyAccess({ tenantId }) {
  const { data: keys = [] } = useQuery({
    queryKey: ['tenant-keys', tenantId],
    queryFn: () => base44.entities.DigitalKey.filter({ tenant_id: tenantId, status: 'active' })
  });

  const activeKey = keys[0];

  return (
    <div className="space-y-4">
      {activeKey ? (
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="w-5 h-5" />
              Digitaler Schlüssel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                {activeKey.key_type === 'app' ? 
                  <Smartphone className="w-10 h-10" /> :
                  <Key className="w-10 h-10" />
                }
              </div>
              <p className="text-sm opacity-90">
                {activeKey.key_type === 'nfc' ? 'NFC-Schlüssel' : 'App-basierter Zugang'}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="opacity-90">Zugangspunkte:</span>
                <span className="font-bold">{activeKey.access_points?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="opacity-90">Gültig bis:</span>
                <span className="font-bold">{new Date(activeKey.valid_until).toLocaleDateString('de-DE')}</span>
              </div>
            </div>

            <Button className="w-full bg-white text-blue-600 hover:bg-white/90">
              <Unlock className="w-4 h-4 mr-2" />
              Haustür öffnen
            </Button>

            {activeKey.access_log && activeKey.access_log.length > 0 && (
              <div className="pt-3 border-t border-white/20">
                <p className="text-xs opacity-75 mb-2">Letzter Zugriff:</p>
                <p className="text-xs">
                  {new Date(activeKey.access_log[activeKey.access_log.length - 1].timestamp).toLocaleString('de-DE')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <Lock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600">Kein digitaler Schlüssel verfügbar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}