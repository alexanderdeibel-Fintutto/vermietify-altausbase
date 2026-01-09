import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import TaxForecastWidget from '@/components/tax/TaxForecastWidget';

export default function TaxForecastPlanner() {
  const [formData, setFormData] = useState({
    yearToDateIncome: 0,
    projectedAnnualIncome: 0,
    yearToDateExpenses: 0,
    projectedAnnualExpenses: 0,
    country: 'DE'
  });

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: parseFloat(value) || 0
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-light mb-2">Steuer-Prognose & Planung</h1>
        <p className="text-slate-600">
          Schätzen Sie Ihre Steuerschuld und optimieren Sie Ihre Steuerplanung
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Finanzielle Daten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Einkommen YTD</Label>
              <Input
                type="number"
                value={formData.yearToDateIncome}
                onChange={(e) => handleInputChange('yearToDateIncome', e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Geschätztes Jahreseinkommen</Label>
              <Input
                type="number"
                value={formData.projectedAnnualIncome}
                onChange={(e) => handleInputChange('projectedAnnualIncome', e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Ausgaben YTD</Label>
              <Input
                type="number"
                value={formData.yearToDateExpenses}
                onChange={(e) => handleInputChange('yearToDateExpenses', e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Geschätzte Jahresausgaben</Label>
              <Input
                type="number"
                value={formData.projectedAnnualExpenses}
                onChange={(e) => handleInputChange('projectedAnnualExpenses', e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 rounded p-2">
              Geschätzter Gewinn: {((formData.projectedAnnualIncome - formData.projectedAnnualExpenses) * 1).toLocaleString('de-DE')} €
            </div>
          </CardContent>
        </Card>

        {/* Forecast Widget */}
        <div className="lg:col-span-2">
          <TaxForecastWidget
            yearToDateIncome={formData.yearToDateIncome}
            projectedAnnualIncome={formData.projectedAnnualIncome}
            yearToDateExpenses={formData.yearToDateExpenses}
            projectedAnnualExpenses={formData.projectedAnnualExpenses}
            country={formData.country}
          />
        </div>
      </div>
    </div>
  );
}