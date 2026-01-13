import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AIMatchSuggestions({ transaction }) {
  const [confirmed, setConfirmed] = useState(false);
  const queryClient = useQueryClient();

  const { data: suggestions = [] } = useQuery({
    queryKey: ['match-suggestions', transaction?.id],
    queryFn: async () => {
      if (!transaction) return [];
      const result = await base44.functions.invoke('autoMatchTransactions', {
        description: transaction.description,
        amount: transaction.amount,
        limit: 3
      });
      return result.data?.suggestions || [];
    },
    enabled: !!transaction && !confirmed
  });

  const acceptMutation = useMutation({
    mutationFn: async (invoiceId) => {
      return await base44.entities.BankTransaction.update(transaction.id, {
        matched_invoice_id: invoiceId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      setConfirmed(true);
    }
  });

  if (confirmed) {
    return (
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="p-3 text-sm text-emerald-700">
          ✓ Verknüpfung bestätigt
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
          <Lightbulb className="w-4 h-4" />
          KI schlägt vor:
        </div>
        
        {suggestions.map((sugg, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-white rounded text-sm">
            <div>
              <p className="font-medium">{sugg.description}</p>
              <p className="text-xs text-slate-500">€{sugg.amount?.toFixed(2)} • {sugg.date}</p>
            </div>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-xs">
                {Math.round(sugg.confidence || 0)}%
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => acceptMutation.mutate(sugg.id)}
                disabled={acceptMutation.isPending}
              >
                <Check className="w-4 h-4 text-emerald-600" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}