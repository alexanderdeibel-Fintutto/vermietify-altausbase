import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp } from 'lucide-react';

export default function AdminPricingSimulator() {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [billingInterval, setBillingInterval] = useState('MONTHLY');
  const [promoCode, setPromoCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['tiers'],
    queryFn: () => base44.entities.PricingTier.list()
  });

  const filteredTiers = tiers.filter(t => t.data.product_id === selectedProduct && t.data.is_active);

  const handleCalculate = async () => {
    if (!selectedTier) return;
    
    setLoading(true);
    try {
      const response = await base44.functions.invoke('calculatePrice', {
        product_id: selectedProduct,
        tier_id: selectedTier,
        billing_interval: billingInterval,
        promo_code: promoCode || null
      });
      setResult(response.data);
    } catch (error) {
      console.error('Calculation error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Preis-Simulator</h1>
        <p className="text-slate-600 mt-1">Teste Preisberechnungen mit verschiedenen Konfigurationen</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Konfiguration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Produkt *</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.data.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tarif *</Label>
              <Select value={selectedTier} onValueChange={setSelectedTier} disabled={!selectedProduct}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filteredTiers.map(t => <SelectItem key={t.id} value={t.id}>{t.data.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Abrechnung *</Label>
              <Select value={billingInterval} onValueChange={setBillingInterval}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monatlich</SelectItem>
                  <SelectItem value="YEARLY">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Promo-Code</Label>
              <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <Button onClick={handleCalculate} disabled={!selectedTier || loading} className="w-full">
            <TrendingUp className="w-4 h-4 mr-2" />
            {loading ? 'Berechne...' : 'Berechnen'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Ergebnis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-slate-600 text-sm">Basis-Preis</p>
                  <p className="text-2xl font-light">{(result.base_price / 100).toFixed(2)}€</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-slate-600 text-sm">Add-ons</p>
                  <p className="text-2xl font-light">{(result.addons_price / 100).toFixed(2)}€</p>
                </div>
              </div>

              {result.discount_amount > 0 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-slate-600 text-sm">Rabatt</p>
                  <p className="text-2xl font-light text-green-600">-{(result.discount_amount / 100).toFixed(2)}€</p>
                </div>
              )}

              <div className="bg-slate-900 text-white p-4 rounded-lg">
                <p className="text-slate-400 text-sm">Gesamtpreis ({result.billing_interval === 'MONTHLY' ? 'monatlich' : 'jährlich'})</p>
                <p className="text-3xl font-light">{(result.final_price / 100).toFixed(2)}€</p>
              </div>

              {result.discounts.length > 0 && (
                <div>
                  <p className="text-slate-600 text-sm mb-2">Angewendete Rabatte:</p>
                  {result.discounts.map((d, i) => (
                    <Badge key={i} variant="secondary">{d.code}: -{(d.amount / 100).toFixed(2)}€</Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}