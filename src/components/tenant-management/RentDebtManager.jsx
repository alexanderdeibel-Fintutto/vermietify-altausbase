import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Mail } from 'lucide-react';

export default function RentDebtManager({ companyId }) {
  const queryClient = useQueryClient();

  const { data: debts = [] } = useQuery({
    queryKey: ['rent-debts', companyId],
    queryFn: () => base44.asServiceRole.entities.RentDebt.filter({ company_id: companyId })
  });

  const reminderMutation = useMutation({
    mutationFn: ({ debtId, level }) =>
      base44.functions.invoke('processRentDebt', { debt_id: debtId, action: 'send_reminder', reminder_level: level }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rent-debts'] })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          Mietschulden & Mahnwesen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {debts.map(debt => {
          const lastReminder = debt.reminders_sent?.[debt.reminders_sent.length - 1];
          const nextLevel = (lastReminder?.level || 0) + 1;

          return (
            <div key={debt.id} className="p-3 border rounded border-red-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-900">
                  {debt.total_debt}€ Schulden
                </span>
                <Badge className="bg-red-100 text-red-700">
                  {debt.status}
                </Badge>
              </div>

              <div className="text-xs space-y-1 mb-2">
                <p>Überfällige Zahlungen: {debt.overdue_payments?.length || 0}</p>
                <p>Mahnungen: {debt.reminders_sent?.length || 0}</p>
              </div>

              {nextLevel <= 3 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => reminderMutation.mutate({ debtId: debt.id, level: nextLevel })}
                  className="w-full gap-1"
                >
                  <Mail className="w-3 h-3" />
                  {nextLevel === 1 ? 'Erinnerung' : nextLevel === 2 ? '2. Mahnung' : 'Letzte Mahnung'}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}