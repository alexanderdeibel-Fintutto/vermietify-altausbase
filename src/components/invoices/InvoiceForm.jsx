import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfDatePicker } from '@/components/shared/VfDatePicker';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function InvoiceForm({ invoice, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    supplier_name: invoice?.supplier_name || '',
    invoice_number: invoice?.invoice_number || '',
    invoice_date: invoice?.invoice_date || '',
    amount: invoice?.amount || '',
    category: invoice?.category || 'maintenance',
    payment_status: invoice?.payment_status || 'pending'
  });

  return (
    <div className="space-y-4">
      <VfInput
        label="Lieferant"
        required
        value={formData.supplier_name}
        onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
      />

      <VfInput
        label="Rechnungsnummer"
        value={formData.invoice_number}
        onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
      />

      <VfDatePicker
        label="Rechnungsdatum"
        value={formData.invoice_date}
        onChange={(v) => setFormData({ ...formData, invoice_date: v })}
      />

      <VfInput
        label="Betrag (€)"
        type="number"
        required
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
      />

      <VfSelect
        label="Kategorie"
        value={formData.category}
        onChange={(v) => setFormData({ ...formData, category: v })}
        options={[
          { value: 'maintenance', label: 'Instandhaltung' },
          { value: 'utilities', label: 'Nebenkosten' },
          { value: 'insurance', label: 'Versicherung' },
          { value: 'management', label: 'Verwaltung' },
          { value: 'other', label: 'Sonstige' }
        ]}
      />

      <VfSelect
        label="Zahlungsstatus"
        value={formData.payment_status}
        onChange={(v) => setFormData({ ...formData, payment_status: v })}
        options={[
          { value: 'pending', label: 'Ausstehend' },
          { value: 'paid', label: 'Bezahlt' },
          { value: 'overdue', label: 'Überfällig' }
        ]}
      />

      <div className="flex gap-3 pt-4">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
        <Button 
          variant="gradient"
          onClick={() => onSubmit(formData)}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          Speichern
        </Button>
      </div>
    </div>
  );
}