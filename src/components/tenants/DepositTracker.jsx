import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';

export default function DepositTracker() {
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositManagement.list()
  });

  const filteredDeposits = selectedStatus === 'all' 
    ? deposits 
    : deposits.filter(d => d.status === selectedStatus);

  const stats = {
    total: deposits.reduce((sum, d) => sum + d.deposit_amount, 0),
    held: deposits.filter(d => d.status === 'HELD').reduce((sum, d) => sum + d.deposit_amount, 0),
    returned: deposits.filter(d => d.status === 'RETURNED').reduce((sum, d) => sum + d.return_amount, 0),
    pending: deposits.filter(d => d.status === 'PENDING').length
  };

  const statusColors = {
    PENDING: 'bg-yellow-50 border-yellow-200',
    RECEIVED: 'bg-blue-50 border-blue-200',
    HELD: 'bg-green-50 border-green-200',
    RETURNED: 'bg-gray-50 border-gray-200',
    OFFSET: 'bg-red-50 border-red-200'
  };

  const statusIcons = {
    PENDING: <AlertCircle className="w-4 h-4 text-yellow-600" />,
    RECEIVED: <DollarSign className="w-4 h-4 text-blue-600" />,
    HELD: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    RETURNED: <CheckCircle2 className="w-4 h-4 text-gray-600" />,
    OFFSET: <AlertCircle className="w-4 h-4 text-red-600" />
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kaution-Verwaltung</h1>
        <p className="text-gray-600 mt-1">Übersicht aller Kautionen</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600">Gesamt</p>
            <p className="text-2xl font-bold">€{stats.total.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600">In Haft</p>
            <p className="text-2xl font-bold text-green-600">€{stats.held.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600">Rückgegeben</p>
            <p className="text-2xl font-bold text-gray-600">€{stats.returned.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600">Ausstehend</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        {['all', 'PENDING', 'RECEIVED', 'HELD', 'RETURNED'].map(status => (
          <Button
            key={status}
            onClick={() => setSelectedStatus(status)}
            variant={selectedStatus === status ? 'default' : 'outline'}
            size="sm"
          >
            {status === 'all' ? 'Alle' : status}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredDeposits.map(deposit => (
          <Card key={deposit.id} className={`border ${statusColors[deposit.status]}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {statusIcons[deposit.status]}
                  <div>
                    <p className="font-medium">{deposit.tenant_name}</p>
                    <p className="text-xs text-gray-600">Einheit: {deposit.unit_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">€{deposit.deposit_amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-600">{deposit.status}</p>
                  {deposit.deductions?.length > 0 && (
                    <p className="text-xs text-red-600">-€{deposit.deductions.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}