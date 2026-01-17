import React from 'react';
import { Check, X } from 'lucide-react';

export default function ComparisonTable({ features, competitors }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Feature</th>
            {competitors.map((comp) => (
              <th key={comp.name} className="text-center p-4">{comp.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index} className="border-b">
              <td className="p-4 font-medium">{feature.name}</td>
              {competitors.map((comp) => (
                <td key={comp.name} className="text-center p-4">
                  {renderValue(feature.values[comp.id])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderValue(value) {
  if (value === true) return <Check className="h-5 w-5 text-[var(--vf-success-500)] mx-auto" />;
  if (value === false) return <X className="h-5 w-5 text-[var(--vf-neutral-300)] mx-auto" />;
  return <span>{value}</span>;
}