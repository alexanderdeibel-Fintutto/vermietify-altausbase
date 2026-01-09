import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, AlertCircle, Download } from 'lucide-react';

export default function AutomatedTaxFormGenerator() {
  const [taxYear] = useState(new Date().getFullYear() - 1);
  const [selectedCountry, setSelectedCountry] = useState('CH');
  const [selectedCanton, setSelectedCanton] = useState('ZH');
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['taxProfile'],
    queryFn: async () => {
      const items = await base44.entities.TaxProfile.list();
      return items[0];
    }
  });

  const { data: forms } = useQuery({
    queryKey: ['taxForms', taxYear, selectedCountry],
    queryFn: async () => {
      const items = await base44.entities.TaxForm.filter({
        country: selectedCountry,
        tax_year: taxYear
      });
      return items;
    }
  });

  const generateFormsCH = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('generateAutomatedTaxFormsCH', {
        tax_year: taxYear,
        canton: selectedCanton
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxForms'] });
    }
  });

  const generateFormsAT = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('generateAutomatedTaxFormsAT', {
        tax_year: taxYear
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxForms'] });
    }
  });

  const generateFormsDe = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('generateAutomatedTaxFormsDe', {
        tax_year: taxYear
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxForms'] });
    }
  });

  const handleGenerate = () => {
    if (selectedCountry === 'CH') {
      generateFormsCH.mutate();
    } else if (selectedCountry === 'AT') {
      generateFormsAT.mutate();
    } else if (selectedCountry === 'DE') {
      generateFormsDe.mutate();
    }
  };

  const isGenerating = generateFormsCH.isPending || generateFormsAT.isPending || generateFormsDe.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light">Automatisierte Steuererklärung</h1>
        <p className="text-slate-500 font-light mt-2">Generiere Land-spezifische Formulare automatisch</p>
      </div>

      {/* Country Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Land auswählen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {profile?.tax_jurisdictions?.map(country => (
                <SelectItem key={country} value={country}>
                  {country === 'AT' ? '🇦🇹 Österreich (FinanzOnline)' : country === 'CH' ? '🇨🇭 Schweiz (Kanton-spezifisch)' : '🇩🇪 Deutschland (ELSTER)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Canton Selector for CH */}
          {selectedCountry === 'CH' && (
            <Select value={selectedCanton} onValueChange={setSelectedCanton}>
              <SelectTrigger>
                <SelectValue placeholder="Kanton..." />
              </SelectTrigger>
              <SelectContent>
                {['ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'TI', 'VD', 'VS', 'NE', 'GE', 'JU'].map(canton => (
                  <SelectItem key={canton} value={canton}>{canton}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isGenerating ? 'Generiere...' : 'Formulare generieren'}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Forms */}
      {forms && forms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Generierte Formulare ({taxYear})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {forms.map((form, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-light text-sm">{form.form_name}</p>
                  <p className="text-xs text-slate-600 font-light mt-1">
                    {form.status === 'draft' ? '✏️ Entwurf' : '✅ Fertig'}
                  </p>
                </div>
                <Button size="icon" variant="ghost" className="text-slate-600">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {generateFormsCH.isSuccess || generateFormsAT.isSuccess || generateFormsDe.isSuccess ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-light text-green-900">
              {selectedCountry === 'CH' 
                ? `${generateFormsCH.data?.forms_generated} Schweizer Formulare erstellt für Kanton ${selectedCanton}`
                : selectedCountry === 'AT'
                ? `${generateFormsAT.data?.forms_generated} österreichische Formulare erstellt (FinanzOnline-ready)`
                : `${generateFormsDe.data?.forms_generated} deutsche Formulare erstellt (ELSTER-ready)`
              }
            </div>
          </CardContent>
        </Card>
      ) : null}

      {generateFormsCH.isError || generateFormsAT.isError || generateFormsDe.isError ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-light text-red-900">
              Fehler beim Generieren. Bitte versuchen Sie es später erneut.
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}