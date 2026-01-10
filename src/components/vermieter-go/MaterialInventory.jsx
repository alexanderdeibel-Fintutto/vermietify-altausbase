import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Minus } from 'lucide-react';

export default function MaterialInventory() {
  const [inventory, setInventory] = useState([
    { id: 1, name: 'Glühbirnen', quantity: 15, min: 10 },
    { id: 2, name: 'Batterien AA', quantity: 8, min: 12 },
    { id: 3, name: 'Reinigungsmittel', quantity: 5, min: 5 },
    { id: 4, name: 'Schrauben Set', quantity: 20, min: 10 }
  ]);

  const updateQuantity = (id, delta) => {
    setInventory(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="w-4 h-4" />
          Materialbestand
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {inventory.map(item => (
          <div key={item.id} className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="font-semibold text-sm">{item.name}</p>
                <p className="text-xs text-slate-600">Min: {item.min}</p>
              </div>
              <Badge className={
                item.quantity < item.min 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }>
                {item.quantity}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateQuantity(item.id, -1)}
                className="flex-1"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateQuantity(item.id, 1)}
                className="flex-1"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}