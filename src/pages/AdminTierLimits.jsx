import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Infinity } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTierLimits() {
  const urlParams = new URLSearchParams(window.location.search);
  const tierId = urlParams.get('tier');
  
  const [limitSettings, setLimitSettings] = useState({});
  const queryClient = useQueryClient();

  const { data: tier } = useQuery({
    queryKey: ['tier', tierId],
    queryFn: async () => {
      const tiers = await base44.entities.PricingTier.filter({ id: tierId });
      return tiers[0];
    },
    enabled: !!tierId
  });

  const { data: limits = [] } = useQuery({
    queryKey: ['usageLimits'],
    queryFn: () => base44.entities.UsageLimit.list('-sort_order')
  });

  const { data: tierLimits = [] } = useQuery({
    queryKey: ['tierLimits', tierId],
    queryFn: () => base44.entities.TierLimit.filter({ tier_id: tierId }),
    enabled: !!tierId
  });

  useEffect(() => {
    const settings = {};
    tierLimits.forEach(tl => {
      settings[tl.limit_id] = tl.limit_value;
    });
    setLimitSettings(settings);
  }, [tierLimits]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const tl of tierLimits) {
        await base44.entities.TierLimit.delete(tl.id);
      }

      const toCreate = Object.entries(limitSettings).map(([limitId, value]) => ({
        tier_id: tierId,
        limit_id: limitId,
        limit_value: value
      }));

      if (toCreate.length > 0) {
        await base44.entities.TierLimit.bulkCreate(toCreate);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tierLimits'] });
      toast.success('Limits gespeichert');
    }
  });

  if (!tier) {
    return <div className="p-6">Tarif nicht gefunden</div>;
  }

  const activeLimits = limits.filter(l => l.is_active);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={createPageUrl('AdminPricingTiers')}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-light text-slate-900">
              Limits für "{tier.name}"
            </h1>
            <p className="text-sm text-slate-600">
              Definiere Nutzungsgrenzen für diesen Tarif
            </p>
          </div>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Speichere...' : 'Änderungen speichern'}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {activeLimits.map(limit => {
            const currentValue = limitSettings[limit.id] ?? 0;
            
            return (
              <div key={limit.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                        {limit.limit_code}
                      </code>
                      <span className="font-medium">{limit.name}</span>
                    </div>
                    {limit.description && (
                      <p className="text-xs text-slate-500">{limit.description}</p>
                    )}
                  </div>

                  <div className="w-48">
                    {limit.limit_type === 'FEATURE_FLAG' ? (
                      <Select 
                        value={String(currentValue)} 
                        onValueChange={v => setLimitSettings({...limitSettings, [limit.id]: Number(v)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Deaktiviert</SelectItem>
                          <SelectItem value="1">Aktiviert</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-1">
                        <Input 
                          type="number"
                          value={currentValue} 
                          onChange={e => setLimitSettings({...limitSettings, [limit.id]: Number(e.target.value)})}
                          placeholder="-1 = unbegrenzt"
                        />
                        <p className="text-xs text-slate-500">
                          {currentValue === -1 ? 'Unbegrenzt' : 
                           currentValue === 0 ? 'Deaktiviert' : 
                           `${currentValue} ${limit.unit || ''}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}