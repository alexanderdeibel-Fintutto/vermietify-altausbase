import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Filter, Upload, Download } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

export default function InvoiceManagementNew() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBuilding, setFilterBuilding] = useState('all');
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-rechnungsdatum', 200)
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['costCategories'],
    queryFn: () => base44.entities.CostCategory.filter({ aktiv: true })
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  const filteredInvoices = invoices.filter(inv => {
    if (filterStatus !== 'all' && inv.zahlungsstatus !== filterStatus) return false;
    if (filterBuilding !== 'all' && inv.building_id !== filterBuilding) return false;
    return true;
  });

  const summeOffen = filteredInvoices
    .filter(i => i.zahlungsstatus === 'Offen')
    .reduce((sum, i) => sum + (i.betrag_brutto || 0), 0);

  const summeBezahlt = filteredInvoices
    .filter(i => i.zahlungsstatus === 'Bezahlt')
    .reduce((sum, i) => sum + (i.betrag_brutto || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Rechnungen</h1>
          <p className="text-slate-500 mt-1">Verwaltung aller Rechnungen</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Hochladen
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Neue Rechnung
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Offene Rechnungen</p>
                <p className="text-2xl font-semibold text-red-600">{formatCurrency(summeOffen)}</p>
              </div>
              <FileText className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Bezahlt (gesamt)</p>
                <p className="text-2xl font-semibold text-emerald-600">{formatCurrency(summeBezahlt)}</p>
              </div>
              <FileText className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Anzahl Rechnungen</p>
                <p className="text-2xl font-semibold text-slate-900">{filteredInvoices.length}</p>
              </div>
              <FileText className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <CardTitle>Filter</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="Offen">Offen</SelectItem>
                <SelectItem value="Bezahlt">Bezahlt</SelectItem>
                <SelectItem value="Storniert">Storniert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={filterBuilding} onValueChange={setFilterBuilding}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Gebäude</SelectItem>
                {buildings.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Rechnungen Liste */}
      <Card>
        <CardHeader>
          <CardTitle>Rechnungen ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-6 text-slate-500">Lade Rechnungen...</p>
          ) : filteredInvoices.length === 0 ? (
            <p className="text-center py-6 text-slate-500">Keine Rechnungen gefunden</p>
          ) : (
            <div className="space-y-2">
              {filteredInvoices.map(invoice => {
                const building = buildings.find(b => b.id === invoice.building_id);
                const category = categories.find(c => c.id === invoice.kategorie_id);

                return (
                  <div key={invoice.id} className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{invoice.lieferant_name}</p>
                          {invoice.rechnungsnummer && (
                            <Badge variant="outline" className="text-xs">#{invoice.rechnungsnummer}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                          <span>{format(new Date(invoice.rechnungsdatum), 'dd.MM.yyyy', { locale: de })}</span>
                          {building && <span>{building.name}</span>}
                          {category && (
                            <Badge variant="outline" className="text-xs">{category.name}</Badge>
                          )}
                        </div>
                        {invoice.bemerkungen && (
                          <p className="text-sm text-slate-500 mt-1">{invoice.bemerkungen}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-slate-900">{formatCurrency(invoice.betrag_brutto)}</p>
                        <p className="text-xs text-slate-500">netto: {formatCurrency(invoice.betrag_netto)}</p>
                        <Badge className={
                          invoice.zahlungsstatus === 'Bezahlt' ? 'bg-emerald-100 text-emerald-700 mt-1' :
                          invoice.zahlungsstatus === 'Offen' ? 'bg-red-100 text-red-700 mt-1' :
                          'bg-slate-100 text-slate-700 mt-1'
                        }>
                          {invoice.zahlungsstatus}
                        </Badge>
                      </div>
                    </div>
                    {invoice.ist_steuerlich_absetzbar && invoice.ist_umlagefaehig && (
                      <div className="flex gap-2 mt-3">
                        <Badge className="bg-blue-100 text-blue-700 text-xs">Steuerlich absetzbar</Badge>
                        <Badge className="bg-purple-100 text-purple-700 text-xs">Umlagefähig</Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}