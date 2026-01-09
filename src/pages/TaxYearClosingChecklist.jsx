import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Circle } from 'lucide-react';

export default function TaxYearClosingChecklist() {
  const [taxYear] = useState(new Date().getFullYear() - 1);
  const [completed, setCompleted] = useState({});

  const { data: checklist } = useQuery({
    queryKey: ['yearEndChecklist', taxYear],
    queryFn: async () => {
      const res = await base44.functions.invoke('generateTaxYearClosingChecklist', { tax_year: taxYear });
      return res.data.checklist;
    }
  });

  if (!checklist) return <div className="p-4 text-slate-500">Loading...</div>;

  const toggleItem = (id) => {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalItems = checklist.reduce((sum, cat) => sum + (cat.items?.length || 0), 0);
  const completedItems = Object.values(completed).filter(Boolean).length;
  const progress = Math.round((completedItems / totalItems) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light">Year-End Checklist {taxYear}</h1>
        <p className="text-slate-500 font-light mt-2">
          Fortschritt: {completedItems}/{totalItems} Items ({progress}%)
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div 
          className="bg-green-600 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklists by Category */}
      <div className="space-y-4">
        {checklist.map((category, catIdx) => (
          <Card key={catIdx} className={category.priority === 'critical' ? 'border-red-200 bg-red-50' : ''}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{category.category}</span>
                <span className="text-xs text-slate-500 font-light">{category.deadline}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {category.items?.map((item, idx) => {
                const itemId = `${catIdx}-${idx}`;
                const isCompleted = completed[itemId];
                return (
                  <label key={itemId} className="flex items-start gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded">
                    <div className="mt-1">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <span className={`text-sm font-light ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                      {item}
                    </span>
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => toggleItem(itemId)}
                      className="hidden"
                    />
                  </label>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {progress === 100 && (
        <Card className="bg-green-50 border-green-200 p-4 text-center">
          <p className="text-lg font-light text-green-700">✓ Alle Aufgaben abgeschlossen!</p>
        </Card>
      )}
    </div>
  );
}