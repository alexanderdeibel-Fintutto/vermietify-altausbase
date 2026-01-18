import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import TimeAgo from '@/components/shared/TimeAgo';
import { Button } from '@/components/ui/button';
import { Eye, Download } from 'lucide-react';

export default function CalculationHistory() {
  const { data: calculations = [] } = useQuery({
    queryKey: ['saved-calculations'],
    queryFn: () => base44.entities.Report.filter({ report_type: { $ne: null } }, '-created_date')
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Berechnungs-Verlauf"
        subtitle={`${calculations.length} gespeicherte Berechnungen`}
      />

      <div className="mt-6 vf-table-container">
        <table className="vf-table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Typ</th>
              <th>Erstellt</th>
              <th className="text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {calculations.map((calc) => (
              <tr key={calc.id}>
                <td className="font-medium">{calc.title}</td>
                <td>{calc.report_type}</td>
                <td><TimeAgo date={calc.created_date} /></td>
                <td className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}