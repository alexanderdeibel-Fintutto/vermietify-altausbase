import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const CURRENT_YEAR = new Date().getFullYear();
const SWISS_CANTONS = { ZH: 'Zürich', BE: 'Bern', LU: 'Luzern', AG: 'Aargau', SG: 'Sankt Gallen', VS: 'Wallis', VD: 'Waadt', TI: 'Tessin', GE: 'Genf', BS: 'Basel-Stadt' };

export default function TaxDashboardCH() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [canton, setCanton] = useState('');

  const { data: investments = [] } = useQuery({
    queryKey: ['investmentsCH', taxYear, canton],
    queryFn: () => canton ? base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton }) || [] : [],
    enabled: !!canton
  });

  const { data: realEstates = [] } = useQuery({
    queryKey: ['realEstateCH', taxYear, canton],
    queryFn: () => canton ? base44.entities.RealEstateCH.filter({ tax_year: taxYear, canton }) || [] : [],
    enabled: !!canton
  });

  const totalInvestments = investments.reduce((sum, inv) => sum + (inv.quantity * inv.current_value), 0);
  const totalRealEstate = realEstates.reduce((sum, p) => sum + p.current_market_value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🇨🇭 Schweiz {taxYear}</h1>
        <div className="w-40">
          <Select value={canton} onValueChange={setCanton}>
            <SelectTrigger>
              <SelectValue placeholder="Kanton wählen..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SWISS_CANTONS).map(([code, name]) => (
                <SelectItem key={code} value={code}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {canton && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to={createPageUrl('InvestmentsCH')}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle>📊 Wertschriften</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">CHF {(totalInvestments / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-slate-500 mt-2">{investments.length} Positionen</p>
                </CardContent>
              </Card>
            </Link>
            <Link to={createPageUrl('RealEstateCH')}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle>🏠 Liegenschaften</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">CHF {(totalRealEstate / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-slate-500 mt-2">{realEstates.length} Objekte</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <Card className="bg-gradient-to-br from-slate-50 to-blue-50">
            <CardHeader>
              <CardTitle>💰 Vermögen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Wertschriften</p>
                  <p className="text-2xl font-bold">CHF {(totalInvestments / 1000).toFixed(1)}K</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Immobilien</p>
                  <p className="text-2xl font-bold">CHF {(totalRealEstate / 1000).toFixed(1)}K</p>
                </div>
                <div className="col-span-2 pt-4 border-t">
                  <p className="text-sm text-slate-600">Gesamtvermögen</p>
                  <p className="text-3xl font-bold">CHF {((totalInvestments + totalRealEstate) / 1000).toFixed(1)}K</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={async () => {
                try {
                  const user = await base44.auth.me();
                  const res = await base44.functions.invoke('generatePDFAnlageCH', {
                    userId: user.id,
                    taxYear,
                    canton
                  });
                  window.open(res.file_url, '_blank');
                  toast.success('PDF erstellt');
                } catch (error) {
                  toast.error('PDF-Fehler: ' + error.message);
                }
              }}
              className="gap-2 ml-auto bg-blue-600 hover:bg-blue-700"
            >
              💾 Exportieren
            </Button>
          </div>
        </>
      )}
    </div>
  );
}