import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function BuildingInventory({ buildingId, inventory = [], onUpdate }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: '', quantity: 1, location: '', condition: 'good' });

  const handleAddItem = () => {
    const newItem = {
      id: Math.random().toString(36),
      ...formData,
      addedDate: new Date().toISOString()
    };
    onUpdate([...inventory, newItem]);
    setFormData({ name: '', category: '', quantity: 1, location: '', condition: 'good' });
    setDialogOpen(false);
  };

  const handleDeleteItem = (itemId) => {
    onUpdate(inventory.filter(item => item.id !== itemId));
  };

  const conditionColors = {
    excellent: 'bg-green-100 text-green-700',
    good: 'bg-blue-100 text-blue-700',
    fair: 'bg-yellow-100 text-yellow-700',
    poor: 'bg-red-100 text-red-700'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Gebäudeinventar</CardTitle>
        <Button size="sm" onClick={() => { setEditingItem(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Element hinzufügen
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Name</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Kategorie</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Menge</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Standort</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Zustand</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-700">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3">{item.name}</td>
                  <td className="py-2 px-3"><Badge variant="outline" className="text-xs">{item.category}</Badge></td>
                  <td className="py-2 px-3">{item.quantity}x</td>
                  <td className="py-2 px-3 text-xs text-slate-600">{item.location}</td>
                  <td className="py-2 px-3">
                    <Badge className={`${conditionColors[item.condition]} text-xs`}>
                      {item.condition}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {inventory.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-6">Keine Inventarelemente</p>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inventarelement hinzufügen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                placeholder="Kategorie"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              <Input
                placeholder="Standort"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Menge"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              />
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              >
                <option value="excellent">Hervorragend</option>
                <option value="good">Gut</option>
                <option value="fair">Befriedigend</option>
                <option value="poor">Schlecht</option>
              </select>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
                <Button onClick={handleAddItem}>Hinzufügen</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}