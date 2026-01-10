import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';

export default function MaintenanceChecklist({ buildingId }) {
  const [checklist, setChecklist] = useState([
    { id: 1, label: 'Treppenhaus gereinigt', checked: false },
    { id: 2, label: 'Beleuchtung geprüft', checked: false },
    { id: 3, label: 'Briefkästen kontrolliert', checked: false },
    { id: 4, label: 'Mülltonnen geleert', checked: false },
    { id: 5, label: 'Außenbereich gepflegt', checked: false },
    { id: 6, label: 'Heizung kontrolliert', checked: false }
  ]);

  const toggleItem = (id) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const completedCount = checklist.filter(i => i.checked).length;
  const progress = (completedCount / checklist.length) * 100;

  const saveMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.BuildingTask.create({
        building_id: buildingId,
        task_title: 'Wartungsrundgang',
        description: checklist.map(c => `${c.checked ? '✅' : '❌'} ${c.label}`).join('\n'),
        task_type: 'maintenance',
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast.success('Checkliste gespeichert');
      setChecklist(prev => prev.map(item => ({ ...item, checked: false })));
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Wartungscheckliste</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Fortschritt</p>
            <p className="text-sm text-slate-600">{completedCount}/{checklist.length}</p>
          </div>
          <Progress value={progress} />
        </div>

        <div className="space-y-2">
          {checklist.map(item => (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className="w-full p-3 rounded-lg border border-slate-200 flex items-center gap-3 hover:bg-slate-50 transition-colors"
            >
              {item.checked ? (
                <CheckSquare className="w-5 h-5 text-green-600" />
              ) : (
                <Square className="w-5 h-5 text-slate-400" />
              )}
              <span className={`text-sm ${item.checked ? 'line-through text-slate-500' : ''}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || completedCount === 0}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Checkliste abschließen
        </Button>
      </CardContent>
    </Card>
  );
}