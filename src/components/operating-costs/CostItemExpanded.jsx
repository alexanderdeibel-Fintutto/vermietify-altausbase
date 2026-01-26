import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus } from 'lucide-react';

export default function CostItemExpanded({ 
  invoices = [], 
  manualEntries = [], 
  total,
  onAddManual,
  onUpdateManual 
}) {
  return (
    <div className="mt-4 pt-4 border-t space-y-2">
      {/* Rechnungen */}
      {invoices.map(invoice => (
        <div key={invoice.id} className="flex items-center gap-3 text-sm py-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="flex-1">{invoice.description}</span>
          <span className="text-gray-600">{new Date(invoice.invoice_date).toLocaleDateString('de-DE')}</span>
          <span className="font-medium w-24 text-right">{invoice.amount?.toFixed(2)} €</span>
        </div>
      ))}

      {/* Manuelle Einträge */}
      {manualEntries.map((entry, idx) => (
        <div key={`manual-${idx}`} className="flex items-center gap-2 py-2">
          <Input
            placeholder="Beschreibung"
            value={entry.description}
            onChange={(e) => onUpdateManual?.(idx, 'description', e.target.value)}
            className="flex-1"
          />
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={entry.amount || ''}
            onChange={(e) => onUpdateManual?.(idx, 'amount', e.target.value)}
            className="w-32"
          />
          <Badge className="bg-purple-100 text-purple-700">Manuell</Badge>
        </div>
      ))}

      {/* Add Manual Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onAddManual}
        className="mt-2"
      >
        <Plus className="w-4 h-4 mr-2" />
        Manuelle Buchung hinzufügen
      </Button>

      {/* Total */}
      <div className="pt-3 border-t mt-3 flex justify-between items-center font-semibold">
        <span>Summe:</span>
        <span className="text-lg">{total?.toFixed(2)} €</span>
      </div>
    </div>
  );
}