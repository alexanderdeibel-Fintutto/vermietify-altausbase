import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Check, X, Minus } from 'lucide-react';

export default function ComparisonView({ 
  itemA,
  itemB,
  fields = [],
  labelA = "Original",
  labelB = "Neu"
}) {
  const getDifferenceIcon = (valueA, valueB) => {
    if (valueA === valueB) return <Minus className="w-4 h-4 text-slate-400" />;
    if (valueB && !valueA) return <Check className="w-4 h-4 text-green-600" />;
    if (!valueB && valueA) return <X className="w-4 h-4 text-red-600" />;
    return <ArrowRight className="w-4 h-4 text-blue-600" />;
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
    if (typeof value === 'number') return value.toLocaleString('de-DE');
    return String(value);
  };

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-slate-700">
                Feld
              </th>
              <th className="text-left p-3 text-sm font-medium text-slate-700">
                {labelA}
              </th>
              <th className="w-12"></th>
              <th className="text-left p-3 text-sm font-medium text-slate-700">
                {labelB}
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => {
              const valueA = itemA?.[field.key];
              const valueB = itemB?.[field.key];
              const isDifferent = valueA !== valueB;

              return (
                <tr 
                  key={field.key}
                  className={`border-b border-slate-100 ${
                    isDifferent ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="p-3 text-sm font-medium text-slate-700">
                    {field.label}
                  </td>
                  <td className="p-3 text-sm text-slate-600">
                    {formatValue(valueA)}
                  </td>
                  <td className="p-3 text-center">
                    {getDifferenceIcon(valueA, valueB)}
                  </td>
                  <td className="p-3 text-sm text-slate-900 font-medium">
                    {formatValue(valueB)}
                    {isDifferent && (
                      <Badge variant="secondary" className="ml-2">
                        Geändert
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}