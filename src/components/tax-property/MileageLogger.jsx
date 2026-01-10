import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Car, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function MileageLogger() {
  const [formData, setFormData] = useState({
    distance: '',
    purpose: '',
    from: '',
    to: ''
  });
  const queryClient = useQueryClient();

  const { data: trips = [] } = useQuery({
    queryKey: ['businessTrips'],
    queryFn: () => base44.entities.FinancialItem.filter(
      { category: 'Fahrtkosten' },
      '-date',
      20
    )
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const deduction = parseFloat(data.distance) * 0.30; // 30 Cent/km
      return await base44.entities.FinancialItem.create({
        date: new Date().toISOString().split('T')[0],
        description: `${data.purpose}: ${data.from} → ${data.to} (${data.distance} km)`,
        amount: deduction,
        type: 'expense',
        category: 'Fahrtkosten',
        is_tax_relevant: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessTrips'] });
      toast.success('Fahrt erfasst');
      setFormData({ distance: '', purpose: '', from: '', to: '' });
    }
  });

  const totalKm = trips.reduce((sum, t) => {
    const match = t.description?.match(/\((\d+) km\)/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);

  const totalDeduction = totalKm * 0.30;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5" />
          Kilometerlogbuch
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-blue-50 rounded text-center">
            <p className="text-xs text-blue-900">Gesamt km</p>
            <p className="text-xl font-bold text-blue-900">{totalKm}</p>
          </div>
          <div className="p-2 bg-green-50 rounded text-center">
            <p className="text-xs text-green-900">Absetzbar</p>
            <p className="text-xl font-bold text-green-900">{totalDeduction.toFixed(0)}€</p>
          </div>
        </div>

        <div className="space-y-2">
          <Input
            placeholder="Von"
            value={formData.from}
            onChange={(e) => setFormData({ ...formData, from: e.target.value })}
          />
          <Input
            placeholder="Nach"
            value={formData.to}
            onChange={(e) => setFormData({ ...formData, to: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Kilometer"
            value={formData.distance}
            onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
          />
          <Input
            placeholder="Zweck"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          />
          <Button
            onClick={() => createMutation.mutate(formData)}
            disabled={!formData.distance}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Fahrt erfassen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}