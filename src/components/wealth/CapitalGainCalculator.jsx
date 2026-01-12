import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { AlertCircle } from 'lucide-react';

export default function CapitalGainCalculator({ assetId, taxYear }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('calculateCapitalGainsTax', {
        assetId,
        taxYear
      });
      setResult(res.data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Kapitalertragsteuer-Berechnung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={calculate} disabled={loading} className="w-full bg-slate-700">
          {loading ? 'Berechne...' : 'Berechnen'}
        </Button>

        {result && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Gewinne:</span>
              <span className="font-semibold text-emerald-600">€{result.gains.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Verluste:</span>
              <span className="font-semibold text-red-600">-€{result.losses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Zu versteuernde Gewinne:</span>
              <span className="font-semibold">€{result.taxableGain.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>KapErtSt (25%):</span>
              <span>€{result.capitalGainsTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Solidaritätszuschlag:</span>
              <span>€{result.solidarityTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kirchensteuer:</span>
              <span>€{result.churchTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 bg-slate-50 p-2 rounded">
              <span className="font-semibold">Gesamtsteuer:</span>
              <span className="font-semibold text-red-600">€{result.totalTax.toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}