import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Receipt, Camera, Euro } from 'lucide-react';
import { toast } from 'sonner';
import MobilePhotoUpload from '@/components/mobile/MobilePhotoUpload';

export default function ExpenseTracker({ buildingId }) {
  const [formData, setFormData] = useState({
    amount: '',
    category: 'maintenance',
    description: '',
    receipt_photo: null
  });
  const queryClient = useQueryClient();

  const { data: recentExpenses = [] } = useQuery({
    queryKey: ['expenses', buildingId],
    queryFn: () => base44.entities.Invoice.filter(
      buildingId ? { building_id: buildingId } : {},
      '-date',
      10
    )
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Invoice.create({
        building_id: buildingId,
        amount: parseFloat(data.amount),
        description: data.description,
        category: data.category,
        date: new Date().toISOString().split('T')[0],
        file_url: data.receipt_photo,
        status: 'open'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Ausgabe erfasst');
      setFormData({ amount: '', category: 'maintenance', description: '', receipt_photo: null });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          Ausgaben-Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold mb-1 block">Betrag</label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Kategorie</label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maintenance">Wartung</SelectItem>
                <SelectItem value="repair">Reparatur</SelectItem>
                <SelectItem value="cleaning">Reinigung</SelectItem>
                <SelectItem value="supplies">Material</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold mb-1 block">Beschreibung</label>
          <Input
            placeholder="Wofür?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Beleg fotografieren
          </label>
          <MobilePhotoUpload
            onUploadComplete={(urls) => setFormData({ ...formData, receipt_photo: urls[0] })}
            maxFiles={1}
          />
        </div>

        <Button
          onClick={() => createMutation.mutate(formData)}
          disabled={!formData.amount || !formData.description}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          Ausgabe speichern
        </Button>

        <div className="pt-3 border-t">
          <p className="text-sm font-semibold mb-2">Letzte Ausgaben</p>
          <div className="space-y-2">
            {recentExpenses.slice(0, 3).map(exp => (
              <div key={exp.id} className="flex justify-between text-sm">
                <span>{exp.description}</span>
                <span className="font-semibold">{exp.amount?.toFixed(2)} €</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}