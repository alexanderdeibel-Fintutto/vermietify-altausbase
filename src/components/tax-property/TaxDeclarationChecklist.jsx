import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckSquare, Square } from 'lucide-react';

export default function TaxDeclarationChecklist() {
  const [items, setItems] = useState([
    { id: 1, label: 'Anlage V für alle Objekte erstellt', checked: false },
    { id: 2, label: 'Anlage KAP mit Kapitalerträgen', checked: false },
    { id: 3, label: 'Werbungskosten gesammelt', checked: false },
    { id: 4, label: 'Sonderausgaben erfasst', checked: false },
    { id: 5, label: 'Kirchensteuer berechnet', checked: false },
    { id: 6, label: 'Handwerkerleistungen dokumentiert', checked: false },
    { id: 7, label: 'Außergewöhnliche Belastungen', checked: false },
    { id: 8, label: 'Vorauszahlungen überprüft', checked: false }
  ]);

  const toggleItem = (id) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const completedCount = items.filter(i => i.checked).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Steuererklärung Checkliste</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <p className="text-sm font-semibold">Fortschritt</p>
            <p className="text-sm">{completedCount}/{items.length}</p>
          </div>
          <Progress value={progress} />
        </div>

        <div className="space-y-2">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className="w-full p-2 rounded-lg border border-slate-200 flex items-center gap-2 hover:bg-slate-50 text-left"
            >
              {item.checked ? (
                <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <span className={`text-sm ${item.checked ? 'line-through text-slate-500' : ''}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}