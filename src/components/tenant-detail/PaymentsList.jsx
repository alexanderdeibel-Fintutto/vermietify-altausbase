import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SortAsc, Filter, TrendingUp } from 'lucide-react';

export default function PaymentsList({ payments }) {
  const [sortBy, setSortBy] = useState('recent');
  const [statusFilter, setStatusFilter] = useState('all');
  const [minAmount, setMinAmount] = useState('');

  const filteredPayments = useMemo(() => {
    let filtered = payments.filter(p => {
      const statusMatch = statusFilter === 'all' || (p.status || 'completed') === statusFilter;
      const amountMatch = !minAmount || p.amount >= parseFloat(minAmount);
      return statusMatch && amountMatch;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_date) - new Date(a.created_date);
        case 'oldest':
          return new Date(a.created_date) - new Date(b.created_date);
        case 'amount_high':
          return (b.amount || 0) - (a.amount || 0);
        case 'amount_low':
          return (a.amount || 0) - (b.amount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [payments, sortBy, statusFilter, minAmount]);

  const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Gesamt-Zahlungen</p>
            <p className="text-xl font-semibold text-slate-900">
              €{totalAmount.toLocaleString('de-DE')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Anzahl Zahlungen</p>
            <p className="text-xl font-semibold text-slate-900">
              {filteredPayments.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Ø Zahlungsbetrag</p>
            <p className="text-xl font-semibold text-slate-900">
              €{(filteredPayments.length > 0 ? totalAmount / filteredPayments.length : 0).toLocaleString('de-DE', { maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Input
          placeholder="Mindestbetrag €"
          type="number"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          className="w-32"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              Alle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
              Abgeschlossen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
              Ausstehend
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('failed')}>
              Fehlgeschlagen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SortAsc className="w-4 h-4" />
              Sortieren
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSortBy('recent')}>
              Neueste zuerst
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('oldest')}>
              Älteste zuerst
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('amount_high')}>
              Höchste zuerst
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('amount_low')}>
              Niedrigste zuerst
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* List */}
      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-500 text-sm">Keine Zahlungen gefunden</p>
          </CardContent>
        </Card>
      ) : (
        filteredPayments.map(payment => (
          <Card key={payment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-slate-900">
                      €{(payment.amount || 0).toLocaleString('de-DE')}
                    </p>
                    <Badge 
                      variant="outline"
                      className={
                        payment.status === 'completed' 
                          ? 'bg-green-50 text-green-800' 
                          : payment.status === 'pending'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-red-50 text-red-800'
                      }
                    >
                      {payment.status === 'completed' ? '✓ Bezahlt' : 
                       payment.status === 'pending' ? 'Ausstehend' : 'Fehlgeschlagen'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    {new Date(payment.created_date).toLocaleDateString('de-DE')}
                  </p>
                  {payment.reference && (
                    <p className="text-xs text-slate-500 mt-1">
                      Ref: {payment.reference}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}