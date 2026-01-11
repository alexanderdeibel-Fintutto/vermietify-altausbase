import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ReserveManager({ companyId }) {
  const queryClient = useQueryClient();

  const { data: reserves = [] } = useQuery({
    queryKey: ['reserves', companyId],
    queryFn: () => base44.asServiceRole.entities.Reserve.filter({ company_id: companyId })
  });

  const projectMutation = useMutation({
    mutationFn: (reserveId) =>
      base44.functions.invoke('calculateReserveProjection', { reserve_id: reserveId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reserves'] })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Rücklagen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {reserves.map(reserve => {
          const fillPercentage = (reserve.current_amount / reserve.target_amount) * 100;

          return (
            <div key={reserve.id} className="p-3 border rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium capitalize">{reserve.reserve_type}</span>
                <Badge>{Math.round(fillPercentage)}%</Badge>
              </div>
              <div className="space-y-2 mb-2">
                <Progress value={Math.min(fillPercentage, 100)} className="h-2" />
                <div className="flex justify-between text-xs">
                  <span>{reserve.current_amount}€ / {reserve.target_amount}€</span>
                  <span>+{reserve.monthly_contribution}€/Monat</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => projectMutation.mutate(reserve.id)}
                className="w-full gap-1"
              >
                <TrendingUp className="w-3 h-3" />
                Prognose
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}