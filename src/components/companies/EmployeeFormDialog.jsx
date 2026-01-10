import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const roles = ['Geschäftsführer', 'Vorstand', 'Gesellschafter', 'Mitarbeiter', 'Kontakt'];

export default function EmployeeFormDialog({ isOpen, onClose, companies = [], editingEmployee = null }) {
  const [formData, setFormData] = useState({
    company_id: '',
    name: '',
    role: '',
    email: '',
    phone: ''
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        company_id: editingEmployee.company_id,
        name: editingEmployee.name,
        role: editingEmployee.role,
        email: editingEmployee.email || '',
        phone: editingEmployee.phone || ''
      });
    } else {
      setFormData({
        company_id: companies.length > 0 ? companies[0].id : '',
        name: '',
        role: '',
        email: '',
        phone: ''
      });
    }
  }, [editingEmployee, isOpen, companies]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const company = await base44.entities.Company.filter({ id: data.company_id });
      if (company.length > 0) {
        const newContact = {
          id: Math.random().toString(36),
          name: data.name,
          role: data.role,
          email: data.email,
          phone: data.phone
        };
        const updatedContacts = [...(company[0].contacts || []), newContact];
        await base44.entities.Company.update(data.company_id, { contacts: updatedContacts });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      handleClose();
    }
  });

  const handleSubmit = () => {
    if (!formData.company_id || !formData.name || !formData.role) {
      alert('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      company_id: companies.length > 0 ? companies[0].id : '',
      name: '',
      role: '',
      email: '',
      phone: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingEmployee ? 'Mitarbeiter bearbeiten' : 'Mitarbeiter hinzufügen'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Company */}
          <div>
            <label className="text-sm font-medium text-slate-700">Unternehmen *</label>
            <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Unternehmen wählen" />
              </SelectTrigger>
              <SelectContent>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-slate-700">Name *</label>
            <Input
              placeholder="z.B. Max Mustermann"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-sm font-medium text-slate-700">Rolle *</label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Rolle wählen" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-slate-700">E-Mail</label>
            <Input
              type="email"
              placeholder="max@example.de"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium text-slate-700">Telefon</label>
            <Input
              type="tel"
              placeholder="+49 123 456789"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>Abbrechen</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}