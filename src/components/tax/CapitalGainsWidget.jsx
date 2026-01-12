import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CapitalGainsWidget({ taxYear = new Date().getFullYear() }) {
  const { data: reportData } = useQuery({
    queryKey: ['anlageKAP', taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateAnlageKAP', { tax_year: taxYear });
      return response.data;
    }
  });

  const totalIncome = reportData?.summary?.total_income || 0;
  const totalTax = reportData?.summary?.total_tax || 0;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Kapitalerträge {taxYear}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-600">Einkünfte</p>
            <p className="text-xl font-bold text-purple-900">
              {totalIncome.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Steuerlast</p>
            <p className="text-xl font-bold text-red-600">
              {totalTax.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Dividenden</span>
            <span className="font-medium">{(reportData?.dividends?.total || 0).toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Kursgewinne</span>
            <span className="font-medium">{(reportData?.capital_gains?.total || 0).toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">FSA verfügbar</span>
            <span className="font-medium text-emerald-600">{(reportData?.freistellungsauftrag?.available || 0).toFixed(2)}€</span>
          </div>
        </div>

        <Link to={createPageUrl('TaxReport')}>
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="w-4 h-4 mr-2" />
            Zur Anlage KAP
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}