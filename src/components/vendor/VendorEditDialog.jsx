import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function VendorEditDialog({ vendor, onClose }) {
  const [formData, setFormData] = useState(vendor || {
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    postal_code: '',
    city: '',
    specialties: [],
    hourly_rate: 0,
    is_active: true,
    preferred: false,
    emergency_contact: false,
    notes: ''
  });

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (vendor?.id) {
        return await base44.entities.Vendor.update(vendor.id, data);
      } else {
        return await base44.entities.Vendor.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success(vendor ? 'Dienstleister aktualisiert' : 'Dienstleister erstellt');
      onClose();
    }
  });

  const specialtyOptions = [
    { value: 'plumbing', label: 'Sanitär' },
    { value: 'electrical', label: 'Elektrik' },
    { value: 'heating', label: 'Heizung' },
    { value: 'cleaning', label: 'Reinigung' },
    { value: 'painting', label: 'Maler' },
    { value: 'carpentry', label: 'Tischlerei' },
    { value: 'locksmith', label: 'Schlüsseldienst' },
    { value: 'roofing', label: 'Dach' },
    { value: 'gardening', label: 'Garten' },
    { value: 'general', label: 'Allgemein' }
  ];

  const toggleSpecialty = (specialty) => {
    const current = formData.specialties || [];
    if (current.includes(specialty)) {
      setFormData({ ...formData, specialties: current.filter(s => s !== specialty) });
    } else {
      setFormData({ ...formData, specialties: [...current, specialty] });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>{vendor ? 'Dienstleister bearbeiten' : 'Neuer Dienstleister'}</CardTitle>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Firmenname *</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Ansprechpartner</Label>
                <Input
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>E-Mail *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Telefon *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mobil</Label>
                <Input
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>
              <div>
                <Label>Stundensatz (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Straße</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label>PLZ</Label>
                <Input
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </div>
              <div>
                <Label>Stadt</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Fachgebiete *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {specialtyOptions.map(option => (
                  <div key={option.value} className="flex items-center gap-2">
                    <Switch
                      checked={formData.specialties?.includes(option.value)}
                      onCheckedChange={() => toggleSpecialty(option.value)}
                    />
                    <Label className="cursor-pointer">{option.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label>Aktiv</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.preferred}
                  onCheckedChange={(v) => setFormData({ ...formData, preferred: v })}
                />
                <Label>Bevorzugter Dienstleister</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.emergency_contact}
                  onCheckedChange={(v) => setFormData({ ...formData, emergency_contact: v })}
                />
                <Label>Notfallkontakt</Label>
              </div>
            </div>

            <div>
              <Label>Notizen</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saveMutation.isPending}>
                {vendor ? 'Aktualisieren' : 'Erstellen'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}