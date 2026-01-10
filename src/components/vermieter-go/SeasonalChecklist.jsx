import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckSquare, Square, Snowflake, Sun } from 'lucide-react';

export default function SeasonalChecklist({ buildingId }) {
  const currentMonth = new Date().getMonth();
  const isWinter = currentMonth >= 10 || currentMonth <= 2;

  const winterChecklist = [
    { id: 1, label: 'Heizung hochgefahren', checked: false },
    { id: 2, label: 'Wasserleitungen isoliert', checked: false },
    { id: 3, label: 'Streugut bereitgestellt', checked: false },
    { id: 4, label: 'Schneeräumung organisiert', checked: false },
    { id: 5, label: 'Dachrinnen gereinigt', checked: false }
  ];

  const summerChecklist = [
    { id: 1, label: 'Klimaanlagen gewartet', checked: false },
    { id: 2, label: 'Außenanlagen gepflegt', checked: false },
    { id: 3, label: 'Sonnenschutz geprüft', checked: false },
    { id: 4, label: 'Bewässerung eingerichtet', checked: false },
    { id: 5, label: 'Grillplatz vorbereitet', checked: false }
  ];

  const [items, setItems] = useState(isWinter ? winterChecklist : summerChecklist);

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
        <CardTitle className="text-base flex items-center gap-2">
          {isWinter ? <Snowflake className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          {isWinter ? 'Winter' : 'Sommer'}-Checkliste
        </CardTitle>
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
              className="w-full p-2 rounded-lg border border-slate-200 flex items-center gap-2 hover:bg-slate-50"
            >
              {item.checked ? (
                <CheckSquare className="w-4 h-4 text-green-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
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