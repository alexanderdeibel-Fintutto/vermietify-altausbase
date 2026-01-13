import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function AdminPricingTierLimits() {
  const urlParams = new URLSearchParams(window.location.search);
  const tierId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [limitValues, setLimitValues] = useState({}); // { limitId: value }

  // Fetch tier
  const { data: tiers = [] } = useQuery({
    queryKey: ['pricingTiers'],
    queryFn: () => base44.entities.PricingTier.list(),
  });
  const tier = tiers.find(t => t.id === tierId);

  // Fetch all usage limits
  const { data: usageLimits = [] } = useQuery({
    queryKey: ['usageLimits'],
    queryFn: () => base44.entities.UsageLimit.list('sort_order', 100),
  });

  // Fetch existing tier limits
  const { data: tierLimits = [] } = useQuery({
    queryKey: ['tierLimits', tierId],
    queryFn: () => base44.entities.TierLimit.filter({ tier_id: tierId }),
    enabled: !!tierId,
  });

  // Initialize limit values from existing data
  useEffect(() => {
    if (tierLimits.length > 0) {
      const values = {};
      tierLimits.forEach(tl => {
        values[tl.data.limit_id] = tl.data.limit_value;
      });
      setLimitValues(values);
    }
  }, [tierLimits]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Delete all existing
      for (const tl of tierLimits) {
        await base44.entities.TierLimit.delete(tl.id);
      }

      // Create new
      const assignments = Object.entries(limitValues)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([limitId, value]) => ({
          tier_id: tierId,
          limit_id: limitId,
          limit_value: parseInt(value)
        }));

      if (assignments.length > 0) {
        await base44.entities.TierLimit.bulkCreate(assignments);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tierLimits'] });
      toast.success('Limits erfolgreich gespeichert');
    },
  });

  const updateLimit = (limitId, value) => {
    setLimitValues(prev => ({
      ...prev,
      [limitId]: value
    }));
  };

  if (!tier) {
    return (
      <div className="p-8">
        <p className="text-slate-600">Tarif nicht gefunden.</p>
        <Link to={createPageUrl('AdminPricingTiersV2')}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to={createPageUrl('AdminPricingTiersV2')}>
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
          </Link>
          <h1 className="text-3xl font-light text-slate-900">
            Limits für "{tier.data.name}"
          </h1>
          <p className="text-slate-600 mt-1">
            Nutzungslimits für diesen Tarif konfigurieren
          </p>
        </div>
        <Button 
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Speichern
        </Button>
      </div>

      {/* Info */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-sm text-slate-700">
            <strong>Hinweis:</strong> -1 = unbegrenzt • 0 = deaktiviert • Leer lassen = Standardwert
          </div>
        </CardContent>
      </Card>

      {/* Limits List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-light flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Verfügbare Limits ({usageLimits.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usageLimits.map(limit => (
              <div key={limit.id} className="p-4 border rounded-lg bg-slate-50">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs bg-slate-200 px-2 py-1 rounded">
                        {limit.data.limit_code}
                      </code>
                      <span className="font-medium">{limit.data.name}</span>
                      <Badge variant="outline" className={
                        limit.data.limit_type === 'HARD' ? 'bg-red-100 text-red-800' :
                        limit.data.limit_type === 'SOFT' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {limit.data.limit_type}
                      </Badge>
                    </div>
                    {limit.data.description && (
                      <p className="text-sm text-slate-600">{limit.data.description}</p>
                    )}
                    {limit.data.unit && (
                      <p className="text-xs text-slate-500 mt-1">Einheit: {limit.data.unit}</p>
                    )}
                  </div>

                  <div className="w-32">
                    <Label className="text-xs">Limit-Wert</Label>
                    <Input
                      type="number"
                      placeholder="-1 = ∞"
                      value={limitValues[limit.id] ?? ''}
                      onChange={(e) => updateLimit(limit.id, e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            ))}

            {usageLimits.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                Keine Limits konfiguriert. Erstelle erst Usage Limits.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}