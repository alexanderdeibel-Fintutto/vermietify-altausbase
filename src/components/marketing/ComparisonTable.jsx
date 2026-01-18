import React from 'react';
import { Check, X } from 'lucide-react';

export default function ComparisonTable() {
  const features = [
    { name: 'Unbegrenzte Objekte', vermitify: true, competitor: false },
    { name: 'KI-Assistent', vermitify: true, competitor: false },
    { name: 'Automatische BK-Abrechnung', vermitify: true, competitor: true },
    { name: 'ELSTER-Integration', vermitify: true, competitor: false },
    { name: 'Mobile App', vermitify: true, competitor: true }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="p-4 text-left">Feature</th>
            <th className="p-4 text-center font-bold text-[var(--theme-primary)]">Vermitify</th>
            <th className="p-4 text-center text-[var(--theme-text-muted)]">Andere</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index} className="border-b">
              <td className="p-4">{feature.name}</td>
              <td className="p-4 text-center">
                {feature.vermitify ? (
                  <Check className="h-5 w-5 text-[var(--vf-success-500)] mx-auto" />
                ) : (
                  <X className="h-5 w-5 text-[var(--theme-text-muted)] mx-auto" />
                )}
              </td>
              <td className="p-4 text-center">
                {feature.competitor ? (
                  <Check className="h-5 w-5 text-[var(--theme-text-muted)] mx-auto" />
                ) : (
                  <X className="h-5 w-5 text-[var(--theme-text-muted)] mx-auto" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}