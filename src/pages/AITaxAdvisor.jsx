import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import AITaxAdvisorChat from '@/components/tax/AITaxAdvisorChat';

export default function AITaxAdvisor() {
  const [taxYear] = useState(new Date().getFullYear() - 1);
  const [selectedCountry, setSelectedCountry] = useState('CH');

  const { data: profile } = useQuery({
    queryKey: ['taxProfile'],
    queryFn: async () => {
      const items = await base44.entities.TaxProfile.list();
      return items[0];
    }
  });

  const availableCountries = profile?.tax_jurisdictions || ['CH'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light">KI Steuerberater</h1>
        <p className="text-slate-500 font-light mt-2">Personalisierte Beratung für Ihre komplexe Steuersituation</p>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-light text-blue-900">
            Der KI-Berater analysiert Ihre Steuerdaten und beantwortet Fragen zu Optimierungen, Compliance & Fristen.
          </div>
        </CardContent>
      </Card>

      {/* Country Selector */}
      <div className="flex gap-2">
        {availableCountries.map(country => (
          <Button
            key={country}
            variant={selectedCountry === country ? 'default' : 'outline'}
            onClick={() => setSelectedCountry(country)}
            className="text-xs"
          >
            {country === 'AT' ? '🇦🇹 Österreich' : country === 'CH' ? '🇨🇭 Schweiz' : '🇩🇪 Deutschland'}
          </Button>
        ))}
      </div>

      {/* Chat Interface */}
      <AITaxAdvisorChat taxYear={taxYear} country={selectedCountry} />

      {/* Quick Help Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Häufige Fragen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="text-xs justify-start h-auto py-2 px-3 text-left whitespace-wrap font-light">
              💡 Wie kann ich Steuern sparen?
            </Button>
            <Button variant="outline" className="text-xs justify-start h-auto py-2 px-3 text-left whitespace-wrap font-light">
              📋 Welche Dokumente brauchte ich?
            </Button>
            <Button variant="outline" className="text-xs justify-start h-auto py-2 px-3 text-left whitespace-wrap font-light">
              🌍 Treaty Benefits erklärt
            </Button>
            <Button variant="outline" className="text-xs justify-start h-auto py-2 px-3 text-left whitespace-wrap font-light">
              ⏰ Wann ist meine Deadline?
            </Button>
            <Button variant="outline" className="text-xs justify-start h-auto py-2 px-3 text-left whitespace-wrap font-light">
              🔄 Crypto Steuern ({selectedCountry})
            </Button>
            <Button variant="outline" className="text-xs justify-start h-auto py-2 px-3 text-left whitespace-wrap font-light">
              ✅ Compliance Checklist
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}