import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Hammer } from 'lucide-react';

export default function RenovationPlanner() {
  const [renovationType, setRenovationType] = useState('bathroom');
  const [budget, setBudget] = useState(0);

  const planMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('planRenovation', {
        type: renovationType,
        budget
      });
      return response.data;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hammer className="w-5 h-5" />
          Renovierungs-Planer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={renovationType} onValueChange={setRenovationType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bathroom">Badezimmer</SelectItem>
            <SelectItem value="kitchen">Küche</SelectItem>
            <SelectItem value="heating">Heizung</SelectItem>
            <SelectItem value="windows">Fenster</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          placeholder="Budget in €"
          value={budget}
          onChange={(e) => setBudget(parseFloat(e.target.value))}
        />
        <Button onClick={() => planMutation.mutate()} className="w-full">
          Renovierung planen
        </Button>
        {planMutation.data && (
          <div className="space-y-2">
            <Badge className="bg-blue-600">ROI: {planMutation.data.roi}%</Badge>
            <p className="text-xs text-slate-600">
              Wertsteigerung: +{planMutation.data.value_increase}€
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}