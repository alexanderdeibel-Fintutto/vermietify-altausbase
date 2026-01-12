import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Calculator } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxSummaryCard({ portfolioId }) {
  const [calculating, setCalculating] = useState(false);
  const [taxData, setTaxData] = useState(null);
  const currentYear = new Date().getFullYear();

  const calculateTax = async () => {
    setCalculating(true);
    try {
      const kapResult = await base44.functions.invoke('calculateTaxKAP', {
        portfolioId,
        year: currentYear
      });

      const cryptoResult = await base44.functions.invoke('calculateCryptoTax', {
        portfolioId,
        year: currentYear
      });

      setTaxData({
        kap: kapResult.data,
        crypto: cryptoResult.data
      });
      toast.success('Steuerberechnung abgeschlossen');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="w-5 h-5 text-slate-600" />
          Steuerübersicht {currentYear}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!taxData ? (
          <Button
            onClick={calculateTax}
            disabled={calculating}
            className="w-full"
            variant="outline"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {calculating ? 'Berechne...' : 'Steuer berechnen'}
          </Button>
        ) : (
          <div className="space-y-4">
            {/* Anlage KAP */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="text-sm font-semibold text-slate-900 mb-2">
                Anlage KAP
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Dividenden:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
                      .format(taxData.kap.kapitalertraege.dividenden)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Veräußerungsgewinne:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
                      .format(taxData.kap.kapitalertraege.veraeusserungsgewinne)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                  <span className="text-slate-900 font-semibold">Steuern gesamt:</span>
                  <span className="font-bold text-slate-900">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
                      .format(taxData.kap.steuern.gesamt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Krypto */}
            {taxData.crypto.kryptowaehrungen.zu_versteuern > 0 && (
              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="text-sm font-semibold text-slate-900 mb-2">
                  Krypto (§23 EStG)
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Kurzfristige Gewinne:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
                        .format(taxData.crypto.kryptowaehrungen.kurzfristige_gewinne)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-amber-200 pt-1 mt-1">
                    <span className="text-slate-900 font-semibold">Zu versteuern:</span>
                    <span className="font-bold text-slate-900">
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
                        .format(taxData.crypto.kryptowaehrungen.zu_versteuern)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={calculateTax} variant="outline" size="sm" className="w-full">
              Neu berechnen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}