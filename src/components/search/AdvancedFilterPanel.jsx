import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

/**
 * Advanced filtering panel for search results
 */
export default function AdvancedFilterPanel({
  onApplyFilters,
  onClose
}) {
  const [filters, setFilters] = useState({
    // Building filters
    building_type: '',
    min_units: '',

    // Tenant filters
    tenant_status: '',

    // Contract filters
    contract_status: '',
    start_date: '',
    end_date: '',

    // Document filters
    document_type: '',
    created_after: '',
    created_before: '',

    // Invoice filters
    invoice_status: '',
    min_amount: '',
    max_amount: ''
  });

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      building_type: '',
      min_units: '',
      tenant_status: '',
      contract_status: '',
      start_date: '',
      end_date: '',
      document_type: '',
      created_after: '',
      created_before: '',
      invoice_status: '',
      min_amount: '',
      max_amount: ''
    });
  };

  return (
    <Card className="p-6 bg-slate-50 border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-light">Filter</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6">
        {/* BUILDINGS */}
        <div className="space-y-3">
          <h4 className="text-sm font-light text-slate-700">Gebäude</h4>
          <Select value={filters.building_type} onValueChange={(value) => setFilters({ ...filters, building_type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Gebäudetype" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle</SelectItem>
              <SelectItem value="residential">Wohngebäude</SelectItem>
              <SelectItem value="commercial">Gewerbe</SelectItem>
              <SelectItem value="mixed">Gemischt</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Min. Wohneinheiten"
            value={filters.min_units}
            onChange={(e) => setFilters({ ...filters, min_units: e.target.value })}
            className="font-light"
          />
        </div>

        {/* TENANTS */}
        <div className="space-y-3">
          <h4 className="text-sm font-light text-slate-700">Mieter</h4>
          <Select value={filters.tenant_status} onValueChange={(value) => setFilters({ ...filters, tenant_status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="inactive">Inaktiv</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* CONTRACTS */}
        <div className="space-y-3">
          <h4 className="text-sm font-light text-slate-700">Verträge</h4>
          <Select value={filters.contract_status} onValueChange={(value) => setFilters({ ...filters, contract_status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="terminated">Beendet</SelectItem>
              <SelectItem value="draft">Entwurf</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder="Von Datum"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="font-light"
            />
            <Input
              type="date"
              placeholder="Bis Datum"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="font-light"
            />
          </div>
        </div>

        {/* DOCUMENTS */}
        <div className="space-y-3">
          <h4 className="text-sm font-light text-slate-700">Dokumente</h4>
          <Select value={filters.document_type} onValueChange={(value) => setFilters({ ...filters, document_type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Dokumenttyp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle</SelectItem>
              <SelectItem value="contract">Vertrag</SelectItem>
              <SelectItem value="invoice">Rechnung</SelectItem>
              <SelectItem value="letter">Brief</SelectItem>
              <SelectItem value="other">Sonstiges</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder="Erstellt nach"
              value={filters.created_after}
              onChange={(e) => setFilters({ ...filters, created_after: e.target.value })}
              className="font-light"
            />
            <Input
              type="date"
              placeholder="Erstellt vor"
              value={filters.created_before}
              onChange={(e) => setFilters({ ...filters, created_before: e.target.value })}
              className="font-light"
            />
          </div>
        </div>

        {/* INVOICES */}
        <div className="space-y-3">
          <h4 className="text-sm font-light text-slate-700">Rechnungen</h4>
          <Select value={filters.invoice_status} onValueChange={(value) => setFilters({ ...filters, invoice_status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle</SelectItem>
              <SelectItem value="draft">Entwurf</SelectItem>
              <SelectItem value="sent">Versendet</SelectItem>
              <SelectItem value="paid">Bezahlt</SelectItem>
              <SelectItem value="overdue">Überfällig</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min. Betrag (€)"
              value={filters.min_amount}
              onChange={(e) => setFilters({ ...filters, min_amount: e.target.value })}
              className="font-light"
            />
            <Input
              type="number"
              placeholder="Max. Betrag (€)"
              value={filters.max_amount}
              onChange={(e) => setFilters({ ...filters, max_amount: e.target.value })}
              className="font-light"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-6 pt-6 border-t border-slate-200">
        <Button
          onClick={handleReset}
          variant="outline"
          className="flex-1 font-light"
        >
          Zurücksetzen
        </Button>
        <Button
          onClick={handleApply}
          className="flex-1 bg-blue-600 hover:bg-blue-700 font-light"
        >
          Filter anwenden
        </Button>
      </div>
    </Card>
  );
}