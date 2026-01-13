import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import FinancingForm from '@/components/financing/FinancingForm';

export default function FinancingManagement() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: financing = [] } = useQuery({
    queryKey: ['financing'],
    queryFn: () => base44.entities.Financing?.list?.() || []
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Financing?.delete?.(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financing'] });
      toast.success('Kreditvertrag gelöscht');
    }
  });

  const totalDebt = financing.filter(f => f.status === 'active').reduce((sum, f) => sum + (f.loan_amount || 0), 0);
  const monthlyPayment = financing.filter(f => f.status === 'active').reduce((sum, f) => {
    const amount = f.loan_amount || 0;
    const rate = (f.interest_rate || 0) / 100 / 12;
    const months = (f.term_years || 1) * 12;
    return sum + (amount * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1));
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">💰 Kreditmanagement</h1>
          <p className="text-gray-600 mt-1">Verwalten Sie Ihre Kreditverträge und Hypotheken</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Kreditvertrag
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Gesamtschulden</p>
            <p className="text-3xl font-bold">€{(totalDebt / 1000).toFixed(0)}k</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Monatliche Rate</p>
            <p className="text-3xl font-bold">€{Math.round(monthlyPayment)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Aktive Kredite</p>
            <p className="text-3xl font-bold">{financing.filter(f => f.status === 'active').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Kreditgeber</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Betrag</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Zinssatz</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {financing.map(f => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{f.lender}</td>
                <td className="px-6 py-4">€{(f.loan_amount || 0).toLocaleString('de-DE')}</td>
                <td className="px-6 py-4">{f.interest_rate}%</td>
                <td className="px-6 py-4">
                  <Badge variant={f.status === 'active' ? 'default' : 'outline'}>
                    {f.status === 'active' ? 'Aktiv' : 'Abgelöst'}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(f); setOpen(true); }}>
                    Bearbeiten
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(f.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <FinancingForm open={open} onOpenChange={setOpen} financing={editing} onSuccess={() => setEditing(null)} />
    </div>
  );
}