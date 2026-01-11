import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Calculator } from 'lucide-react';

export default function LoanTracker({ companyId }) {
  const queryClient = useQueryClient();

  const { data: loans = [] } = useQuery({
    queryKey: ['loans', companyId],
    queryFn: () => base44.asServiceRole.entities.Financing.filter({ company_id: companyId })
  });

  const amortizeMutation = useMutation({
    mutationFn: (loanId) =>
      base44.functions.invoke('generateLoanAmortization', { financing_id: loanId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loans'] })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building className="w-4 h-4" />
          Kredite & Finanzierungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loans.map(loan => (
          <div key={loan.id} className="p-3 border rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{loan.bank || 'Kredit'}</span>
              <Badge>{loan.interest_rate}% Zinssatz</Badge>
            </div>
            <div className="text-xs space-y-1 mb-2">
              <p>Betrag: {loan.loan_amount}€</p>
              <p>Laufzeit: {loan.duration_years} Jahre</p>
              {loan.start_date && <p>Start: {loan.start_date}</p>}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => amortizeMutation.mutate(loan.id)}
              className="w-full gap-1"
            >
              <Calculator className="w-3 h-3" />
              Tilgungsplan
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}