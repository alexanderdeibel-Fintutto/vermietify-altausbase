import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfProgress } from '@/components/shared/VfProgress';
import { BarChart3 } from 'lucide-react';

export default function UsageSummary() {
  const usage = [
    { name: 'Objekte', used: 3, limit: 5 },
    { name: 'Einheiten', used: 12, limit: 20 },
    { name: 'Mieter', used: 8, limit: 25 },
    { name: 'Dokumente', used: 145, limit: 500 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Nutzung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {usage.map((item, index) => {
            const percentage = (item.used / item.limit) * 100;
            return (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm font-semibold">{item.used}/{item.limit}</span>
                </div>
                <VfProgress 
                  value={percentage} 
                  max={100} 
                  variant={percentage > 80 ? 'warning' : 'success'}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}