import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

export default function QuickTenantSetup({ onComplete }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    move_in_date: '',
    base_rent: '',
    building_id: ''
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create tenant
      const tenant = await base44.entities.Tenant.create({
        first_name: formData.first_name,
        last_name: formData.last_name
      });

      // Create unit if needed
      const units = await base44.entities.Unit.filter({ building_id: formData.building_id });
      let unit = units[0];
      
      if (!unit) {
        unit = await base44.entities.Unit.create({
          building_id: formData.building_id,
          name: 'Wohnung',
          status: 'occupied'
        });
      }

      // Create lease contract
      await base44.entities.LeaseContract.create({
        tenant_id: tenant.id,
        unit_id: unit.id,
        building_id: formData.building_id,
        start_date: formData.move_in_date,
        base_rent: parseFloat(formData.base_rent),
        status: 'active'
      });

      toast.success('Mieter erfolgreich angelegt! 🎉');
      onComplete({ tenant, unit });
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast.error('Fehler beim Anlegen des Mieters');
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Ersten Mieter hinzufügen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstname">Vorname *</Label>
              <Input
                id="firstname"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastname">Nachname *</Label>
              <Input
                id="lastname"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="building">Objekt *</Label>
            <Select value={formData.building_id} onValueChange={(val) => setFormData({ ...formData, building_id: val })}>
              <SelectTrigger id="building">
                <SelectValue placeholder="Objekt wählen" />
              </SelectTrigger>
              <SelectContent>
                {buildings.map(building => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="movein">Einzugsdatum *</Label>
              <Input
                id="movein"
                type="date"
                value={formData.move_in_date}
                onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="rent">Kaltmiete (€) *</Label>
              <Input
                id="rent"
                type="number"
                value={formData.base_rent}
                onChange={(e) => setFormData({ ...formData, base_rent: e.target.value })}
                placeholder="z.B. 850"
                step="0.01"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
            Mieter anlegen
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}