import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function FinancialRecordsManager() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: payments = [] } = useQuery({
    queryKey: ['allPayments'],
    queryFn: () => base44.entities.Payment.list('-created_date')
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['allInvoices'],
    queryFn: () => base44.entities.GeneratedDocument.filter({
      document_type: 'mietvertrag'
    }, '-created_date')
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['allTenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const filteredInvoices = invoices.filter(inv => {
    if (filterStatus !== 'all' && inv.distribution_status !== filterStatus) {
      return false;
    }
    const tenant = tenants.find(t => t.id === inv.tenant_id);
    return (
      inv.document_data?.invoiceNumber?.includes(searchTerm) ||
      (tenant && `${tenant.first_name} ${tenant.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const stats = {
    totalRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    totalInvoiced: invoices.reduce((sum, inv) => sum + (inv.document_data?.amount || 0), 0),
    openAmount: invoices
      .filter(inv => inv.distribution_status !== 'paid')
      .reduce((sum, inv) => sum + (inv.document_data?.amount || 0), 0),
    paidCount: invoices.filter(inv => inv.distribution_status === 'paid').length
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Gesamteinnahmen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)}€</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Rechnungsvolumen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalInvoiced.toFixed(2)}€</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Offene Beträge</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.openAmount.toFixed(2)}€</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Bezahlte Rechnungen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.paidCount}/{invoices.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Rechnungen & Zahlungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Nach Rechnungsnr. oder Mieter suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="paid">Bezahlt</SelectItem>
                <SelectItem value="generated">Offen</SelectItem>
                <SelectItem value="failed">Fehler</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rechnungshistorie ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Rechnungsnr.</th>
                  <th className="text-left py-2 px-3">Mieter</th>
                  <th className="text-left py-2 px-3">Betrag</th>
                  <th className="text-left py-2 px-3">Fällig</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Datum</th>
                  <th className="text-left py-2 px-3">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => {
                  const tenant = tenants.find(t => t.id === inv.tenant_id);
                  return (
                    <tr key={inv.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-3 font-medium">{inv.document_data?.invoiceNumber}</td>
                      <td className="py-3 px-3">{tenant?.first_name} {tenant?.last_name}</td>
                      <td className="py-3 px-3 font-bold">{inv.document_data?.amount?.toFixed(2)}€</td>
                      <td className="py-3 px-3">
                        {inv.document_data?.dueDate && !isNaN(new Date(inv.document_data.dueDate).getTime())
                          ? format(new Date(inv.document_data.dueDate), 'dd. MMM yyyy', { locale: de })
                          : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          inv.distribution_status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : inv.distribution_status === 'generated'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {inv.distribution_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600">
                        {inv.created_date && !isNaN(new Date(inv.created_date).getTime())
                          ? format(new Date(inv.created_date), 'dd.MM.yyyy', { locale: de })
                          : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}