import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Repeat, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function RecurringBookings() {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    interval: 'monthly',
    category: ''
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Automation.create({
        name: `Wiederkehrend: ${data.description}`,
        trigger_type: 'scheduled',
        schedule: data.interval,
        action_type: 'create_financial_item',
        action_config: {
          description: data.description,
          amount: parseFloat(data.amount),
          category: data.category,
          type: 'expense'
        },
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Wiederkehrende Buchung angelegt');
      setFormData({ description: '', amount: '', interval: 'monthly', category: '' });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="w-5 h-5" />
          Wiederkehrende Buchungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Beschreibung"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Betrag"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
          <Select value={formData.interval} onValueChange={(v) => setFormData({ ...formData, interval: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Wöchentlich</SelectItem>
              <SelectItem value="monthly">Monatlich</SelectItem>
              <SelectItem value="quarterly">Vierteljährlich</SelectItem>
              <SelectItem value="yearly">Jährlich</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="Kategorie"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        />
        <Button
          onClick={() => createMutation.mutate(formData)}
          disabled={!formData.description || !formData.amount}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Anlegen
        </Button>
      </CardContent>
    </Card>
  );
}