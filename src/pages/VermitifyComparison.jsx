import React from 'react';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VermitifyComparison() {
  const comparison = [
    {
      feature: 'Anzahl Objekte',
      excel: 'Unbegrenzt',
      competitors: '10-50',
      vermitify: 'Unbegrenzt',
      highlight: false
    },
    {
      feature: 'Preis pro Monat',
      excel: '0€',
      competitors: '49-99€',
      vermitify: '29€',
      highlight: true
    },
    {
      feature: 'Anlage V Export',
      excel: false,
      competitors: true,
      vermitify: true,
      highlight: false
    },
    {
      feature: 'BK-Abrechnung',
      excel: 'Manuell',
      competitors: 'Automatisch',
      vermitify: 'Automatisch + KI',
      highlight: true
    },
    {
      feature: 'Mobile App',
      excel: false,
      competitors: true,
      vermitify: true,
      highlight: false
    },
    {
      feature: 'Kostenlose Tools',
      excel: false,
      competitors: false,
      vermitify: '9 Tools',
      highlight: true
    },
    {
      feature: 'Support',
      excel: '-',
      competitors: 'E-Mail',
      vermitify: 'E-Mail + Chat',
      highlight: false
    },
    {
      feature: 'DSGVO-konform',
      excel: 'Eigenverantwortung',
      competitors: true,
      vermitify: true,
      highlight: false
    }
  ];

  return (
    <VfMarketingLayout>
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Warum vermitify?</h1>
          <p className="text-xl text-[var(--theme-text-secondary)]">
            Der Vergleich mit Excel und anderen Lösungen
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full vf-card">
            <thead>
              <tr className="bg-[var(--theme-surface)]">
                <th className="p-4 text-left">Feature</th>
                <th className="p-4 text-center">Excel</th>
                <th className="p-4 text-center">Wettbewerb</th>
                <th className="p-4 text-center bg-[var(--vf-primary-50)] font-bold">vermitify</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, index) => (
                <tr 
                  key={index}
                  className={cn(
                    row.highlight && "bg-[var(--vf-primary-50)]",
                    "border-b border-[var(--theme-divider)]"
                  )}
                >
                  <td className="p-4 font-medium">{row.feature}</td>
                  <td className="p-4 text-center">{renderValue(row.excel)}</td>
                  <td className="p-4 text-center">{renderValue(row.competitors)}</td>
                  <td className="p-4 text-center font-semibold text-[var(--vf-primary-600)]">
                    {renderValue(row.vermitify)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 text-center">
          <a href="/signup" className="vf-btn vf-btn-gradient vf-btn-lg">
            Jetzt kostenlos testen →
          </a>
        </div>
      </div>
    </VfMarketingLayout>
  );
}

function renderValue(value) {
  if (value === true) {
    return <Check className="h-5 w-5 text-[var(--vf-success-500)] mx-auto" />;
  }
  if (value === false) {
    return <X className="h-5 w-5 text-[var(--vf-neutral-300)] mx-auto" />;
  }
  return value;
}