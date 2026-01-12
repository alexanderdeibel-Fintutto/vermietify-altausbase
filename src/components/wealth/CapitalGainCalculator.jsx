import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp } from 'lucide-react';

export default function CapitalGainCalculator() {
  const [salePrice, setSalePrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [fees, setFees] = useState('0');
  const [holding, setHolding] = useState('short'); // short (< 1 Jahr) oder long (>= 1 Jahr)
  const [result, setResult] = useState(null);

  const handleCalculate = async () => {
    const revenue = parseFloat(salePrice) * parseFloat(quantity);
    const costBasis = parseFloat(purchasePrice) * parseFloat(quantity);
    const gain = revenue - costBasis - parseFloat(fees || 0);

    try {
      // Rufe Backend-Funktion auf
      const response = await base44.functions.invoke('calculateCapitalGainsTax', {
        gain: gain,
        fsa_available: 801, // Sparerpauschbetrag
        kirchensteuer_satz: 0.08, // Bayern
      });

      setResult({
        revenue,
        costBasis,
        gain,
        ...response.data,
      });
    } catch (error) {
      console.error('Fehler bei Berechnung:', error);
    }
  };

  const isTaxFree = holding === 'long' && parseFloat(gain || 0) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Kapitalertragsteuer-Rechner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick">Schnell-Rechner</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="quantity">Menge *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                placeholder="10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="purchase">Kaufpreis/Anteil (EUR) *</Label>
                <Input
                  id="purchase"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="sale">Verkaufspreis/Anteil (EUR) *</Label>
                <Input
                  id="sale"
                  type="number"
                  step="0.01"
                  placeholder="120.00"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="fees">Gebühren (EUR)</Label>
              <Input
                id="fees"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
              />
            </div>

            <div>
              <Label>Haltefrist</Label>
              <div className="flex gap-2">
                <Button
                  variant={holding === 'short' ? 'default' : 'outline'}
                  onClick={() => setHolding('short')}
                  className="flex-1"
                >
                  &lt; 1 Jahr
                </Button>
                <Button
                  variant={holding === 'long' ? 'default' : 'outline'}
                  onClick={() => setHolding('long')}
                  className="flex-1"
                >
                  ≥ 1 Jahr
                </Button>
              </div>
            </div>

            <Button onClick={handleCalculate} className="w-full">
              Berechnen
            </Button>

            {/* Ergebnis */}
            {result && (
              <div className="space-y-3 mt-4 border-t pt-4">
                <Alert className={isTaxFree ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}>
                  <AlertDescription className={isTaxFree ? 'text-green-800' : 'text-blue-800'}>
                    {isTaxFree ? '✅ Steuerfrei (1-Jahres-Haltefrist)' : `⚠️ Steuerbar`}
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-600">Verkaufserlös</p>
                    <p className="font-semibold">{result.revenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Anschaffungskosten</p>
                    <p className="font-semibold">{result.costBasis.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Gain/Loss</p>
                    <p className={`font-semibold ${result.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {result.gain.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">Steuerpflichtig</p>
                    <p className="font-semibold">
                      {(result.gain - result.fsa_available).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                </div>

                {!isTaxFree && (
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>KapErtSt (25%)</span>
                      <span className="font-semibold text-red-600">{result.capital_gains_tax?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Solidaritätszuschlag</span>
                      <span className="font-semibold text-red-600">{result.solidarity_tax?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Kirchensteuer</span>
                      <span className="font-semibold text-red-600">{result.church_tax?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Gesamt Steuern</span>
                      <span className="text-red-600">{result.total_tax?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-green-600">
                      <span>Netto nach Steuern</span>
                      <span>{result.net_gain?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="info" className="space-y-3 mt-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Kapitalertragssteuer (KapErtSt)</h4>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>Pauschale: 25% (+ 5,5% Solidaritätszuschlag + ggf. Kirchensteuer)</li>
                <li>Sparerpauschbetrag: 801 € (Ledig) / 1.200 € (Verheiratet)</li>
                <li>Gilt für: Kapitalgewinne, Dividenden, Zinsen</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Kryptowährungen & Edelmetalle</h4>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>Steuerfrei: Haltefrist ≥ 1 Jahr</li>
                <li>Steuerpflichtig: Haltefrist &lt; 1 Jahr (Einkünfte aus private Veräußerungsgeschäfte)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Optimierungsmaßnahmen</h4>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>Sparerpauschbetrag vollständig nutzen</li>
                <li>Tax-Loss-Harvesting bei Verlusten</li>
                <li>Haltefristen beachten</li>
                <li>Günstigerprüfung bei hohen Einkommen</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}