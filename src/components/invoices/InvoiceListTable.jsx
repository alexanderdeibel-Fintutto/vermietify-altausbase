import React from 'react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import { Eye, Download } from 'lucide-react';

export default function InvoiceListTable({ invoices = [], onView, onDownload }) {
  return (
    <div className="vf-table-container">
      <table className="vf-table">
        <thead>
          <tr>
            <th>Rechnungsnummer</th>
            <th>Lieferant</th>
            <th>Betrag</th>
            <th>Datum</th>
            <th>Status</th>
            <th className="text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td className="font-medium">{invoice.invoice_number || invoice.id.slice(0, 8)}</td>
              <td>{invoice.supplier_name || 'Unbekannt'}</td>
              <td>
                <CurrencyDisplay amount={invoice.amount || 0} />
              </td>
              <td>{invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('de-DE') : '-'}</td>
              <td>
                <StatusBadge status={invoice.payment_status || 'pending'} />
              </td>
              <td className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => onView(invoice)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDownload(invoice)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}