import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const legalForms = [
  { value: 'einzelunternehmen', label: 'Einzelunternehmen' },
  { value: 'gbr', label: 'GbR (Gesellschaft bürgerlichen Rechts)' },
  { value: 'ohg', label: 'OHG (Offene Handelsgesellschaft)' },
  { value: 'kg', label: 'KG (Kommanditgesellschaft)' },
  { value: 'gmbh', label: 'GmbH (Gesellschaft mit beschränkter Haftung)' },
  { value: 'ag', label: 'AG (Aktiengesellschaft)' },
  { value: 'se', label: 'SE (Europäische Gesellschaft)' },
  { value: 'genossenschaft', label: 'Genossenschaft' },
  { value: 'ev', label: 'e.V. (Eingetragener Verein)' },
  { value: 'other', label: 'Sonstige' }
];

export default function CompanyFormDialog({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    legal_form: '',
    address: '',
    registration_number: '',
    tax_id: '',
    industry: '',
    founding_date: '',
    employees_count: '',
    annual_revenue: '',
    status: 'active'
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setFormData({
        name: '',
        legal_form: '',
        address: '',
        registration_number: '',
        tax_id: '',
        industry: '',
        founding_date: '',
        employees_count: '',
        annual_revenue: '',
        status: 'active'
      });
      onClose();
    }
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.legal_form || !formData.address) {
      alert('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }
    createMutation.mutate({
      ...formData,
      employees_count: formData.employees_count ? parseInt(formData.employees_count) : 0,
      annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : 0
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Neues Unternehmen erstellen</DialogTitle>
          <DialogDescription>Geben Sie die Grundinformationen zu Ihrem Unternehmen ein</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-slate-700">Unternehmensname *</label>
            <Input
              placeholder="z.B. Musterfirma GmbH"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Legal Form */}
          <div>
            <label className="text-sm font-medium text-slate-700">Rechtsform *</label>
            <Select value={formData.legal_form} onValueChange={(value) => setFormData({ ...formData, legal_form: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Wählen Sie eine Rechtsform" />
              </SelectTrigger>
              <SelectContent>
                {legalForms.map(form => (
                  <SelectItem key={form.value} value={form.value}>{form.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Address */}
          <div className="col-span-2">
            <label className="text-sm font-medium text-slate-700">Geschäftsadresse *</label>
            <Input
              placeholder="Straße, Hausnummer, PLZ, Stadt"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Registration Number */}
          <div>
            <label className="text-sm font-medium text-slate-700">Handelsregisternummer</label>
            <Input
              placeholder="z.B. HRB 123456"
              value={formData.registration_number}
              onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Tax ID */}
          <div>
            <label className="text-sm font-medium text-slate-700">Steuernummer/USt-ID</label>
            <Input
              placeholder="z.B. 12 345 678 901"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="text-sm font-medium text-slate-700">Branche</label>
            <Input
              placeholder="z.B. Dienstleistungen"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Founding Date */}
          <div>
            <label className="text-sm font-medium text-slate-700">Gründungsdatum</label>
            <Input
              type="date"
              value={formData.founding_date}
              onChange={(e) => setFormData({ ...formData, founding_date: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Employees */}
          <div>
            <label className="text-sm font-medium text-slate-700">Anzahl Mitarbeiter</label>
            <Input
              type="number"
              placeholder="0"
              value={formData.employees_count}
              onChange={(e) => setFormData({ ...formData, employees_count: e.target.value })}
              className="mt-1"
              min="0"
            />
          </div>

          {/* Annual Revenue */}
          <div>
            <label className="text-sm font-medium text-slate-700">Jahresumsatz (€)</label>
            <Input
              type="number"
              placeholder="0"
              value={formData.annual_revenue}
              onChange={(e) => setFormData({ ...formData, annual_revenue: e.target.value })}
              className="mt-1"
              min="0"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Wird erstellt...' : 'Unternehmen erstellen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}