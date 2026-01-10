import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function UnitRating({ unitId }) {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const categories = [
    { key: 'cleanliness', label: 'Sauberkeit' },
    { key: 'condition', label: 'Zustand' },
    { key: 'equipment', label: 'Ausstattung' }
  ];

  const [categoryRatings, setCategoryRatings] = useState({
    cleanliness: 0,
    condition: 0,
    equipment: 0
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const avgRating = (categoryRatings.cleanliness + categoryRatings.condition + categoryRatings.equipment) / 3;
      
      return await base44.entities.Document.create({
        name: `Zustandsbewertung ${new Date().toLocaleDateString('de-DE')}`,
        unit_id: unitId,
        category: 'Verwaltung',
        status: 'erstellt',
        content: JSON.stringify({
          ratings: categoryRatings,
          average: avgRating,
          notes
        })
      });
    },
    onSuccess: () => {
      toast.success('Bewertung gespeichert');
      setCategoryRatings({ cleanliness: 0, condition: 0, equipment: 0 });
      setNotes('');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Zustandsbewertung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map(cat => (
          <div key={cat.key}>
            <p className="text-sm font-semibold mb-2">{cat.label}</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setCategoryRatings({ ...categoryRatings, [cat.key]: star })}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= categoryRatings[cat.key]
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}

        <Textarea
          placeholder="Zusätzliche Notizen..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={Object.values(categoryRatings).every(r => r === 0)}
          className="w-full bg-blue-600"
        >
          <Save className="w-4 h-4 mr-2" />
          Bewertung speichern
        </Button>
      </CardContent>
    </Card>
  );
}