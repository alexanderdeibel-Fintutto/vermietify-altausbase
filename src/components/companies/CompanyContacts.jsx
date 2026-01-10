import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Mail, Phone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const roles = ['Geschäftsführer', 'Vorstand', 'Gesellschafter', 'Mitarbeiter', 'Kontakt'];

export default function CompanyContacts({ contacts = [], onUpdate }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', role: '', email: '', phone: '' });

  const handleAddContact = () => {
    if (!formData.name || !formData.role) return;
    const newContact = {
      id: Math.random().toString(36),
      ...formData
    };
    onUpdate([...contacts, newContact]);
    setFormData({ name: '', role: '', email: '', phone: '' });
    setDialogOpen(false);
  };

  const handleDeleteContact = (contactId) => {
    onUpdate(contacts.filter(c => c.id !== contactId));
  };

  const roleColors = {
    'Geschäftsführer': 'bg-red-100 text-red-700',
    'Vorstand': 'bg-blue-100 text-blue-700',
    'Gesellschafter': 'bg-purple-100 text-purple-700',
    'Mitarbeiter': 'bg-green-100 text-green-700',
    'Kontakt': 'bg-slate-100 text-slate-700'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Kontakte & Mitarbeiter</CardTitle>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Kontakt hinzufügen
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {contacts.map(contact => (
            <div key={contact.id} className="p-3 bg-slate-50 rounded-lg border">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-slate-900">{contact.name}</h4>
                  <Badge className={`${roleColors[contact.role]} text-xs mt-1`}>
                    {contact.role}
                  </Badge>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteContact(contact.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {contact.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Mail className="w-3 h-3" />
                    <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Phone className="w-3 h-3" />
                    <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                      {contact.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {contacts.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-6">Keine Kontakte vorhanden</p>
        )}

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kontakt hinzufügen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              >
                <option value="">Rolle wählen</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <Input
                type="email"
                placeholder="E-Mail"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                type="tel"
                placeholder="Telefon"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
                <Button onClick={handleAddContact} disabled={!formData.name || !formData.role}>
                  Hinzufügen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}