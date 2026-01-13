import React from 'react';
import { Card } from '@/components/ui/card';

export default function ComparisonView({ 
  items = [],
  columns = [],
  highlightDifferences = true
}) {
  if (items.length < 2 || columns.length === 0) return null;

  const getDifferences = () => {
    const diffs = new Set();
    const [first, second] = items;

    columns.forEach(col => {
      if (first[col.key] !== second[col.key]) {
        diffs.add(col.key);
      }
    });

    return diffs;
  };

  const differences = getDifferences();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-300">
            <th className="p-3 text-left font-medium text-slate-700">Feld</th>
            {items.map((item, idx) => (
              <th key={idx} className="p-3 text-left font-medium text-slate-700">
                {item.label || `Version ${idx + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {columns.map((col) => {
            const isDifferent = differences.has(col.key);
            return (
              <tr
                key={col.key}
                className={`border-b border-slate-200 ${
                  isDifferent && highlightDifferences ? 'bg-amber-50' : ''
                }`}
              >
                <td className="p-3 font-medium text-slate-700">{col.label}</td>
                {items.map((item, idx) => (
                  <td
                    key={idx}
                    className={`p-3 ${
                      isDifferent && highlightDifferences
                        ? 'bg-amber-100 text-amber-900 font-semibold'
                        : ''
                    }`}
                  >
                    {col.format
                      ? col.format(item[col.key])
                      : item[col.key] || '—'}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}