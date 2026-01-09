import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const COUNTRIES = ['AT', 'CH', 'DE'];

export default function MultiCountryForm({ onSubmit, isLoading }) {
  const [selected, setSelected] = useState([]);

  const toggle = (country) => {
    setSelected(prev =>
      prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-light text-slate-600">
        Welche Länder betreffen Ihre Steuerlage?
      </p>
      
      <div className="grid grid-cols-3 gap-3">
        {COUNTRIES.map(country => (
          <Card
            key={country}
            className={`cursor-pointer transition-all ${
              selected.includes(country)
                ? 'ring-2 ring-slate-900 bg-slate-900 text-white'
                : 'bg-white'
            }`}
            onClick={() => toggle(country)}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-light mb-1">
                {country === 'AT' ? '🇦🇹' : country === 'CH' ? '🇨🇭' : '🇩🇪'}
              </p>
              <p className="text-sm font-light">{country}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={() => onSubmit({ tax_jurisdictions: selected })}
        disabled={isLoading || selected.length === 0}
        className="w-full"
      >
        {isLoading ? 'Speichern...' : 'Fortfahren'}
      </Button>
    </div>
  );
}