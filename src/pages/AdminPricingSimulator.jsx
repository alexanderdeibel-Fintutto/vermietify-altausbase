import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calculator, Check, AlertCircle } from 'lucide-react';

export default function AdminPricingSimulator() {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedTierId, setSelectedTierId] = useState('');
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [promoCode, setPromoCode] = useState('');
  const [promoValid, setPromoValid] = useState(null);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['tiers', selectedProductId],
    queryFn: () => base44.entities.PricingTier.filter({ product_id: selectedProductId }),
    enabled: !!selectedProductId
  });

  const { data: tierFeatures = [] } = useQuery({
    queryKey: ['tierFeatures', selectedTierId],
    queryFn: () => base44.entities.TierFeature.filter({ tier_id: selectedTierId }),
    enabled: !!selectedTierId
  });

  const { data: features = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => base44.entities.Feature.list()
  });

  const calculateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('calculatePrice', {
        tier_id: selectedTierId,
        billing_cycle: billingCycle,
        addon_ids: selectedAddons,
        quantities,
        promo_code: promoCode
      });
      return response.data;
    }
  });

  const handleCalculate = () => {
    if (!selectedTierId) return;
    calculateMutation.mutate();
  };

  const selectedTier = tiers.find(t => t.id === selectedTierId);
  const availableAddons = tierFeatures.filter(tf => tf.data.inclusion_type === 'AVAILABLE');

  const formatCurrency = (cents) => {
    return `${(cents / 100).toFixed(2)}€`;
  };

  const result = calculateMutation.data;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Pricing-Simulator</h1>
          <p className="text-slate-600 mt-1">Teste Preisberechnungen mit verschiedenen Szenarien</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Konfiguration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-light">Szenario konfigurieren</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Produkt-Auswahl */}
            <div className="space-y-2">
              <Label>Produkt *</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Produkt wählen" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.data.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tarif-Auswahl */}
            <div className="space-y-2">
              <Label>Tarif *</Label>
              <Select 
                value={selectedTierId} 
                onValueChange={setSelectedTierId}
                disabled={!selectedProductId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tarif wählen" />
                </SelectTrigger>
                <SelectContent>
                  {tiers.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.data.name} - {formatCurrency(t.data.price_monthly)}/Monat
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Billing Cycle */}
            <div className="space-y-2">
              <Label>Abrechnungsintervall *</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={billingCycle === 'MONTHLY'}
                    onChange={() => setBillingCycle('MONTHLY')}
                    className="w-4 h-4"
                  />
                  <span>Monatlich</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={billingCycle === 'YEARLY'}
                    onChange={() => setBillingCycle('YEARLY')}
                    className="w-4 h-4"
                  />
                  <span>Jährlich</span>
                </label>
              </div>
            </div>

            {/* Add-Ons */}
            {availableAddons.length > 0 && (
              <div className="space-y-2">
                <Label>Add-Ons hinzufügen</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableAddons.map(tf => {
                    const feature = features.find(f => f.id === tf.data.feature_id);
                    if (!feature) return null;
                    
                    const price = tf.data.price_override || feature.data.standalone_price || 0;
                    const isSelected = selectedAddons.includes(tf.data.feature_id);
                    
                    return (
                      <div key={tf.id} className="flex items-center gap-2 p-2 border rounded-lg">
                        <Switch
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAddons([...selectedAddons, tf.data.feature_id]);
                            } else {
                              setSelectedAddons(selectedAddons.filter(id => id !== tf.data.feature_id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-light">{feature.data.name}</div>
                          <div className="text-sm text-slate-500">+{formatCurrency(price)}/Monat</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Promo-Code */}
            <div className="space-y-2">
              <Label>Promo-Code</Label>
              <div className="flex gap-2">
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  className="uppercase"
                />
                {promoValid === true && <Check className="w-5 h-5 text-green-600" />}
                {promoValid === false && <AlertCircle className="w-5 h-5 text-red-600" />}
              </div>
            </div>

            <Button 
              onClick={handleCalculate}
              disabled={!selectedTierId || calculateMutation.isPending}
              className="w-full"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Preis berechnen
            </Button>
          </CardContent>
        </Card>

        {/* Ergebnis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-light">Preisberechnung</CardTitle>
          </CardHeader>
          <CardContent>
            {!result && (
              <div className="text-center py-12 text-slate-400">
                <Calculator className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Konfiguriere ein Szenario und klicke auf "Preis berechnen"</p>
              </div>
            )}

            {calculateMutation.isError && (
              <div className="text-center py-12 text-red-600">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <p>Fehler bei der Berechnung</p>
                <p className="text-sm">{calculateMutation.error?.message}</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Basis-Preis */}
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-slate-600">Basis-Preis ({selectedTier?.data.name})</span>
                  <span className="font-light">{formatCurrency(result.breakdown.base_price)}</span>
                </div>

                {/* Add-Ons */}
                {result.breakdown.addons.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-slate-500">+ Add-Ons</div>
                    {result.breakdown.addons.map((addon, idx) => (
                      <div key={idx} className="flex justify-between pl-4 text-sm">
                        <span className="text-slate-600">{addon.name}</span>
                        <span>+{formatCurrency(addon.price)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Zwischensumme */}
                <div className="flex justify-between pt-2 border-t font-medium">
                  <span>Zwischensumme</span>
                  <span>{formatCurrency(result.breakdown.base_price + result.breakdown.addons.reduce((sum, a) => sum + a.price, 0))}</span>
                </div>

                {/* Rabatte */}
                {result.breakdown.discounts.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-slate-500">- Rabatte</div>
                    {result.breakdown.discounts.map((discount, idx) => (
                      <div key={idx} className="flex justify-between pl-4 text-sm text-green-700">
                        <span>{discount.name}</span>
                        <span>-{formatCurrency(discount.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gesamtpreis */}
                <div className="flex justify-between pt-4 border-t-2 text-xl font-light">
                  <span>Gesamtpreis</span>
                  <span className="text-emerald-600">{formatCurrency(result.breakdown.total)}</span>
                </div>

                {billingCycle === 'YEARLY' && (
                  <div className="text-center text-sm text-slate-500">
                    Das entspricht {formatCurrency(result.monthly_equivalent)}/Monat
                  </div>
                )}

                {/* Ersparnis */}
                {result.savings.amount > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                    <div className="text-emerald-900 font-medium">
                      Ersparnis: {formatCurrency(result.savings.amount)}
                    </div>
                    <div className="text-sm text-emerald-700">
                      {result.savings.percent}% günstiger
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}