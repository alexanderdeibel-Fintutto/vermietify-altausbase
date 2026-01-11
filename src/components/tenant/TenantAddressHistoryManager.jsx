import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MapPin, Calendar, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function TenantAddressHistoryManager({ tenantId, tenant }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    address_type: 'future',
    street: '',
    house_number: '',
    postal_code: '',
    city: '',
    country: 'Deutschland',
    valid_from: '',
    valid_until: '',
    is_current: false,
    notes: ''
  });

  const queryClient = useQueryClient();

  const addAddressMutation = useMutation({
    mutationFn: async (address) => {
      const currentHistory = tenant.address_history || [];
      const updatedHistory = [...currentHistory, address];
      
      await base44.entities.Tenant.update(tenantId, {
        address_history: updatedHistory
      });
    },
    onSuccess: () => {
      toast.success('Adresse hinzugefügt');
      queryClient.invalidateQueries(['tenant', tenantId]);
      setShowAddForm(false);
      setNewAddress({
        address_type: 'future',
        street: '',
        house_number: '',
        postal_code: '',
        city: '',
        country: 'Deutschland',
        valid_from: '',
        valid_until: '',
        is_current: false,
        notes: ''
      });
    },
    onError: (error) => {
      toast.error('Fehler beim Hinzufügen: ' + error.message);
    }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (index) => {
      const currentHistory = tenant.address_history || [];
      const updatedHistory = currentHistory.filter((_, i) => i !== index);
      
      await base44.entities.Tenant.update(tenantId, {
        address_history: updatedHistory
      });
    },
    onSuccess: () => {
      toast.success('Adresse gelöscht');
      queryClient.invalidateQueries(['tenant', tenantId]);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addAddressMutation.mutate(newAddress);
  };

  const addressHistory = tenant.address_history || [];

  const getAddressTypeLabel = (type) => {
    switch(type) {
      case 'previous': return 'Vorherige Adresse';
      case 'current': return 'Aktuelle Adresse';
      case 'future': return 'Zukünftige Adresse';
      default: return type;
    }
  };

  const getAddressTypeBadge = (type, isCurrent) => {
    if (isCurrent) {
      return <Badge className="bg-green-100 text-green-800">Aktuell</Badge>;
    }
    switch(type) {
      case 'previous': 
        return <Badge className="bg-slate-100 text-slate-800">Vorherig</Badge>;
      case 'future': 
        return <Badge className="bg-blue-100 text-blue-800">Zukünftig</Badge>;
      default: 
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Adresshistorie
          </CardTitle>
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Neue Adresse
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Address Form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-slate-50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Adresstyp</Label>
                <Select value={newAddress.address_type} onValueChange={(val) => setNewAddress({...newAddress, address_type: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="previous">Vorherige Adresse</SelectItem>
                    <SelectItem value="current">Aktuelle Adresse</SelectItem>
                    <SelectItem value="future">Zukünftige Adresse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Gültig ab</Label>
                <Input
                  type="date"
                  value={newAddress.valid_from}
                  onChange={(e) => setNewAddress({...newAddress, valid_from: e.target.value})}
                />
              </div>

              <div>
                <Label>Straße</Label>
                <Input
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                  placeholder="Straße"
                  required
                />
              </div>

              <div>
                <Label>Hausnummer</Label>
                <Input
                  value={newAddress.house_number}
                  onChange={(e) => setNewAddress({...newAddress, house_number: e.target.value})}
                  placeholder="Nr."
                />
              </div>

              <div>
                <Label>PLZ</Label>
                <Input
                  value={newAddress.postal_code}
                  onChange={(e) => setNewAddress({...newAddress, postal_code: e.target.value})}
                  placeholder="PLZ"
                  required
                />
              </div>

              <div>
                <Label>Stadt</Label>
                <Input
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                  placeholder="Stadt"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Notizen</Label>
              <Input
                value={newAddress.notes}
                onChange={(e) => setNewAddress({...newAddress, notes: e.target.value})}
                placeholder="z.B. Grund für Umzug"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Hinzufügen</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Abbrechen</Button>
            </div>
          </form>
        )}

        {/* Address History List */}
        <div className="space-y-3">
          {addressHistory.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Keine Adresshistorie vorhanden</p>
          ) : (
            addressHistory.map((address, index) => (
              <div key={index} className="p-3 border rounded-lg bg-white">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    {getAddressTypeBadge(address.address_type, address.is_current)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAddressMutation.mutate(index)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
                <p className="font-medium">
                  {address.street} {address.house_number}
                </p>
                <p className="text-sm text-slate-600">
                  {address.postal_code} {address.city}
                </p>
                {address.valid_from && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    Ab: {new Date(address.valid_from).toLocaleDateString('de-DE')}
                    {address.valid_until && ` - Bis: ${new Date(address.valid_until).toLocaleDateString('de-DE')}`}
                  </div>
                )}
                {address.notes && (
                  <p className="text-xs text-slate-500 mt-1 italic">{address.notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}