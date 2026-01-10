import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function QuoteCreator({ buildingId }) {
  const [items, setItems] = useState([
    { description: '', quantity: 1, unit_price: '' }
  ]);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: '' }]);
  };

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, value) => {
    setItems(items.map((item, i) => 
      i === idx ? { ...item, [field]: value } : item
    ));
  };

  const total = items.reduce((sum, item) => 
    sum + (parseFloat(item.unit_price) || 0) * (item.quantity || 0), 0
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const quoteContent = items.map(item => 
        `${item.quantity}x ${item.description} à ${item.unit_price}€ = ${(item.quantity * item.unit_price).toFixed(2)}€`
      ).join('\n');

      return await base44.entities.Document.create({
        name: `Kostenvoranschlag ${new Date().toLocaleDateString('de-DE')}`,
        building_id: buildingId,
        category: 'Finanzen',
        status: 'erstellt',
        content: `${quoteContent}\n\nGesamtsumme: ${total.toFixed(2)}€`
      });
    },
    onSuccess: () => {
      toast.success('Kostenvoranschlag gespeichert');
      setItems([{ description: '', quantity: 1, unit_price: '' }]);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Kostenvoranschlag
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="p-2 bg-slate-50 rounded-lg space-y-2">
            <Input
              placeholder="Position"
              value={item.description}
              onChange={(e) => updateItem(idx, 'description', e.target.value)}
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="number"
                placeholder="Anz."
                value={item.quantity}
                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Preis"
                value={item.unit_price}
                onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
              />
              {items.length > 1 && (
                <Button size="sm" variant="outline" onClick={() => removeItem(idx)}>
                  <Minus className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}

        <Button size="sm" variant="outline" onClick={addItem} className="w-full">
          <Plus className="w-3 h-3 mr-1" />
          Position hinzufügen
        </Button>

        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-semibold text-blue-900">
            Gesamtsumme: {total.toFixed(2)} €
          </p>
        </div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={items.every(i => !i.description)}
          className="w-full bg-blue-600"
        >
          Kostenvoranschlag speichern
        </Button>
      </CardContent>
    </Card>
  );
}