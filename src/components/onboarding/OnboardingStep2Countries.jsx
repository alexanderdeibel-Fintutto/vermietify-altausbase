import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function OnboardingStep2Countries({ formData, setFormData }) {
  const countries = [
    { code: 'DE', name: 'Deutschland', flag: '🇩🇪' },
    { code: 'AT', name: 'Österreich', flag: '🇦🇹' },
    { code: 'CH', name: 'Schweiz', flag: '🇨🇭' }
  ];

  const toggleCountry = (code) => {
    const updated = formData.tax_jurisdictions.includes(code)
      ? formData.tax_jurisdictions.filter(c => c !== code)
      : [...formData.tax_jurisdictions, code];
    setFormData({ ...formData, tax_jurisdictions: updated });
  };

  return (
    <div className="space-y-4">
      <p className="text-slate-600 mb-6">
        Wählen Sie alle Länder, für die Sie Steuerpflicht haben.
      </p>
      <div className="space-y-3">
        {countries.map(country => (
          <Card
            key={country.code}
            className={`p-4 cursor-pointer transition-all ${
              formData.tax_jurisdictions.includes(country.code)
                ? 'border-2 border-blue-600 bg-blue-50'
                : 'border border-slate-200 hover:border-slate-300'
            }`}
            onClick={() => toggleCountry(country.code)}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={formData.tax_jurisdictions.includes(country.code)}
                onCheckedChange={() => toggleCountry(country.code)}
              />
              <span className="text-2xl">{country.flag}</span>
              <Label className="cursor-pointer flex-1 font-medium">
                {country.name}
              </Label>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}