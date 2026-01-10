import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, CheckCircle } from 'lucide-react';

export default function TaxYearOverview() {
  const { data: taxForms = [] } = useQuery({
    queryKey: ['taxForms'],
    queryFn: () => base44.entities.TaxForm.list(null, 100)
  });

  const currentYear = new Date().getFullYear();
  const formsThisYear = taxForms.filter(f => f.tax_year === currentYear);

  const requiredForms = [
    { name: 'Hauptvordruck', completed: formsThisYear.some(f => f.form_type === 'ESt1A') },
    { name: 'Anlage V', completed: formsThisYear.some(f => f.form_type === 'AnlageV') },
    { name: 'Anlage KAP', completed: formsThisYear.some(f => f.form_type === 'AnlageKAP') },
    { name: 'Anlage SO', completed: formsThisYear.some(f => f.form_type === 'AnlageSO') }
  ];

  const completedCount = requiredForms.filter(f => f.completed).length;
  const progress = (completedCount / requiredForms.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Steuerjahr {currentYear}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <p className="text-sm font-semibold">Fortschritt</p>
            <p className="text-sm">{completedCount}/{requiredForms.length}</p>
          </div>
          <Progress value={progress} />
        </div>

        <div className="space-y-2">
          {requiredForms.map(form => (
            <div key={form.name} className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm">{form.name}</span>
              {form.completed ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Badge variant="outline">Offen</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}