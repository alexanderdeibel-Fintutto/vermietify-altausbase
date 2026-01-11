import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, Smartphone, CreditCard } from 'lucide-react';

export default function DigitalKeyManager({ companyId }) {
  const { data: keys = [] } = useQuery({
    queryKey: ['digital-keys', companyId],
    queryFn: () => base44.asServiceRole.entities.DigitalKey.filter({ company_id: companyId })
  });

  const getKeyIcon = (type) => {
    switch (type) {
      case 'nfc': return <CreditCard className="w-4 h-4" />;
      case 'app': return <Smartphone className="w-4 h-4" />;
      default: return <Key className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Key className="w-4 h-4" />
          Digitale Schlüssel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {keys.map(key => (
          <div key={key.id} className="p-3 border rounded">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getKeyIcon(key.key_type)}
                <span className="text-sm font-medium">{key.key_type.toUpperCase()}</span>
              </div>
              <Badge variant={key.status === 'active' ? 'outline' : 'destructive'}>
                {key.status}
              </Badge>
            </div>
            <div className="text-xs space-y-1">
              <p>Mieter: {key.tenant_id}</p>
              <p>Gültig bis: {key.valid_until}</p>
              <p className="text-slate-600">
                {key.access_points?.length || 0} Zugangspunkte
              </p>
              {key.access_log && key.access_log.length > 0 && (
                <p className="text-green-600">
                  Letzter Zugriff: {new Date(key.access_log[key.access_log.length - 1].timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}