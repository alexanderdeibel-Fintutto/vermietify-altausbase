import React from 'react';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FeatureVergleich() {
  const features = [
    { category: 'Objektverwaltung', items: [
      { name: 'Objekte', starter: '2', pro: '∞', business: '∞' },
      { name: 'Einheiten', starter: '∞', pro: '∞', business: '∞' },
      { name: 'Mieter', starter: '∞', pro: '∞', business: '∞' },
      { name: 'Dokumente', starter: true, pro: true, business: true }
    ]},
    { category: 'Rechner & Tools', items: [
      { name: 'Rendite-Rechner', starter: true, pro: true, business: true },
      { name: 'AfA-Rechner', starter: true, pro: true, business: true },
      { name: 'Indexmieten-Rechner', starter: true, pro: true, business: true },
      { name: 'Cashflow-Rechner', starter: true, pro: true, business: true }
    ]},
    { category: 'Steuern', items: [
      { name: 'Anlage V Export', starter: false, pro: true, business: true },
      { name: 'ELSTER-Integration', starter: false, pro: true, business: true },
      { name: 'Steueroptimierung', starter: false, pro: true, business: true }
    ]},
    { category: 'Automatisierung', items: [
      { name: 'BK-Abrechnungen', starter: false, pro: true, business: true },
      { name: 'Mietvertrag-Generator', starter: false, pro: true, business: true },
      { name: 'LetterXpress', starter: false, pro: true, business: true },
      { name: 'API-Zugang', starter: false, pro: true, business: true }
    ]},
    { category: 'Team & Multi-Mandant', items: [
      { name: 'Team-Mitglieder', starter: '1', pro: '3', business: '∞' },
      { name: 'Multi-Mandanten', starter: false, pro: false, business: true },
      { name: 'White-Label', starter: false, pro: false, business: true }
    ]},
    { category: 'Support', items: [
      { name: 'Community-Support', starter: true, pro: true, business: true },
      { name: 'E-Mail-Support', starter: false, pro: true, business: true },
      { name: 'Priority Support', starter: false, pro: false, business: true },
      { name: 'Onboarding-Beratung', starter: false, pro: false, business: true }
    ]}
  ];

  return (
    <VfMarketingLayout>
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Feature-Vergleich</h1>
          <p className="text-xl text-[var(--theme-text-secondary)]">
            Alle Funktionen im Detail
          </p>
        </div>

        <div className="vf-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--theme-surface)]">
                <th className="text-left p-4 font-semibold">Feature</th>
                <th className="text-center p-4 font-semibold">Starter</th>
                <th className="text-center p-4 font-semibold bg-[var(--vf-primary-50)]">Professional</th>
                <th className="text-center p-4 font-semibold">Business</th>
              </tr>
            </thead>
            <tbody>
              {features.map((category) => (
                <React.Fragment key={category.category}>
                  <tr className="bg-[var(--theme-surface)]">
                    <td colSpan={4} className="p-4 font-semibold text-sm uppercase tracking-wide text-[var(--theme-text-muted)]">
                      {category.category}
                    </td>
                  </tr>
                  {category.items.map((feature, index) => (
                    <tr key={feature.name} className={cn(index % 2 === 0 && "bg-[var(--theme-surface)]")}>
                      <td className="p-4">{feature.name}</td>
                      <td className="text-center p-4">
                        {renderFeatureValue(feature.starter)}
                      </td>
                      <td className="text-center p-4 bg-[var(--vf-primary-50)]">
                        {renderFeatureValue(feature.pro)}
                      </td>
                      <td className="text-center p-4">
                        {renderFeatureValue(feature.business)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </VfMarketingLayout>
  );
}

function renderFeatureValue(value) {
  if (value === true) {
    return <Check className="h-5 w-5 text-[var(--vf-success-500)] mx-auto" />;
  }
  if (value === false) {
    return <X className="h-5 w-5 text-[var(--vf-neutral-300)] mx-auto" />;
  }
  return <span className="font-medium">{value}</span>;
}