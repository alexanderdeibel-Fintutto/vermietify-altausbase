import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function FormComparisonView({ submissions, formType }) {
  const formSubmissions = submissions
    .filter(s => s.form_type === formType || s.tax_form_type === formType)
    .sort((a, b) => b.tax_year - a.tax_year)
    .slice(0, 3);

  if (formSubmissions.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jahresvergleich</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-500 py-4">
            Mindestens 2 Jahre benötigt für Vergleich
          </p>
        </CardContent>
      </Card>
    );
  }

  const compareValues = (current, previous, field) => {
    const currentVal = current?.form_data?.[field];
    const previousVal = previous?.form_data?.[field];

    if (!currentVal || !previousVal) return null;

    const diff = currentVal - previousVal;
    const percentChange = ((diff / previousVal) * 100).toFixed(1);

    return { diff, percentChange, current: currentVal, previous: previousVal };
  };

  const keyFields = formType === 'ANLAGE_V' 
    ? ['income_rent', 'expense_property_tax', 'afa_amount']
    : ['revenue', 'profit'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jahresvergleich {formType}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {formSubmissions.slice(0, 2).map((current, idx) => {
          const previous = formSubmissions[idx + 1];
          if (!previous) return null;

          return (
            <div key={current.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium">{current.tax_year}</span>
                <Badge variant="outline">vs {previous.tax_year}</Badge>
              </div>

              <div className="space-y-2">
                {keyFields.map(field => {
                  const comparison = compareValues(current, previous, field);
                  if (!comparison) return null;

                  const Icon = comparison.diff > 0 ? TrendingUp : comparison.diff < 0 ? TrendingDown : Minus;
                  const color = comparison.diff > 0 ? 'text-green-600' : comparison.diff < 0 ? 'text-red-600' : 'text-slate-600';

                  return (
                    <div key={field} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">{field}</span>
                      <div className="flex items-center gap-2">
                        <span>{comparison.current.toLocaleString('de-DE')} €</span>
                        <Badge variant="outline" className={`${color} flex items-center gap-1`}>
                          <Icon className="w-3 h-3" />
                          {comparison.percentChange}%
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}