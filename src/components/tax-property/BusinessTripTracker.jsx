import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plane, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function BusinessTripTracker() {
  const [formData, setFormData] = useState({
    destination: '',
    purpose: '',
    start_date: '',
    end_date: '',
    hotel_cost: '',
    meals_cost: '',
    travel_cost: ''
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const total = (parseFloat(data.hotel_cost) || 0) + 
                    (parseFloat(data.meals_cost) || 0) + 
                    (parseFloat(data.travel_cost) || 0);
      
      return await base44.entities.FinancialItem.create({
        date: data.start_date,
        description: `Geschäftsreise ${data.destination} - ${data.purpose}`,
        amount: total,
        type: 'expense',
        category: 'Reisekosten',
        is_tax_relevant: true,
        metadata: {
          hotel: data.hotel_cost,
          meals: data.meals_cost,
          travel: data.travel_cost,
          days: Math.ceil((new Date(data.end_date) - new Date(data.start_date)) / (1000 * 60 * 60 * 24))
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialItems'] });
      toast.success('Geschäftsreise erfasst');
      setFormData({ destination: '', purpose: '', start_date: '', end_date: '', hotel_cost: '', meals_cost: '', travel_cost: '' });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="w-5 h-5" />
          Geschäftsreisen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Ziel"
          value={formData.destination}
          onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
        />
        <Input
          placeholder="Zweck"
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input
            type="number"
            placeholder="Hotel €"
            value={formData.hotel_cost}
            onChange={(e) => setFormData({ ...formData, hotel_cost: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Essen €"
            value={formData.meals_cost}
            onChange={(e) => setFormData({ ...formData, meals_cost: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Reise €"
            value={formData.travel_cost}
            onChange={(e) => setFormData({ ...formData, travel_cost: e.target.value })}
          />
        </div>
        <Button
          onClick={() => createMutation.mutate(formData)}
          disabled={!formData.destination}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Reise erfassen
        </Button>
      </CardContent>
    </Card>
  );
}