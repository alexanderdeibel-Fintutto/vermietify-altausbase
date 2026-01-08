import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, Building } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ROIDashboard() {
  const [roi, setRoi] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const calculate = async () => {
    setCalculating(true);
    try {
      const response = await base44.functions.invoke('calculateROI', {});
      
      if (response.data.success) {
        setRoi(response.data.roi);
        toast.success('ROI berechnet');
      }
    } catch (error) {
      toast.error('Berechnung fehlgeschlagen');
      console.error(error);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          ROI Analyse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!roi ? (
          <Button onClick={calculate} disabled={calculating} className="w-full">
            {calculating ? 'Berechne...' : 'ROI berechnen'}
          </Button>
        ) : (
          <>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <div className="text-xs text-slate-600 mb-1">Return on Investment</div>
              <div className="text-3xl font-bold text-green-600">{roi.roi_percentage}%</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-slate-50 rounded">
                <div className="text-xs text-slate-600">Kosten</div>
                <div className="font-bold">€{roi.total_costs.toLocaleString('de-DE')}</div>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <div className="text-xs text-slate-600">Nutzen</div>
                <div className="font-bold text-green-600">€{roi.total_benefits.toLocaleString('de-DE')}</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Zeit gespart: {roi.time_saved_hours}h</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                <span>Gebäude: {roi.buildings_managed}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}