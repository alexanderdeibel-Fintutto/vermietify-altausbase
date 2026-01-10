import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const specializationOptions = [
  { value: 'electrical', label: 'Elektrik' },
  { value: 'plumbing', label: 'Sanitär' },
  { value: 'heating', label: 'Heizung' },
  { value: 'cleaning', label: 'Reinigung' },
  { value: 'general', label: 'Allgemein' }
];

const roleOptions = [
  { value: 'building_manager', label: 'Gebäudemanager' },
  { value: 'caretaker', label: 'Hausmeister' },
  { value: 'technician', label: 'Techniker' }
];

export default function TechnicianFormDialog({ technician, onClose }) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState(technician || {
    user_email: '',
    full_name: '',
    role: 'technician',
    phone: '',
    assigned_buildings: [],
    specializations: [],
    is_active: true,
    availability_hours: ''
  });

  const [selectedBuildings, setSelectedBuildings] = useState(technician?.assigned_buildings || []);
  const [selectedSpecs, setSelectedSpecs] = useState(technician?.specializations || []);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...formData,
        assigned_buildings: selectedBuildings,
        specializations: selectedSpecs
      };
      if (technician?.id) {
        await base44.entities.BuildingManager.update(technician.id, data);
      } else {
        await base44.entities.BuildingManager.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['building-managers']);
      toast.success(technician ? 'Techniker aktualisiert' : 'Techniker erstellt');
      onClose();
    }
  });

  const toggleBuilding = (buildingId) => {
    if (selectedBuildings.includes(buildingId)) {
      setSelectedBuildings(selectedBuildings.filter(id => id !== buildingId));
    } else {
      setSelectedBuildings([...selectedBuildings, buildingId]);
    }
  };

  const toggleSpecialization = (spec) => {
    if (selectedSpecs.includes(spec)) {
      setSelectedSpecs(selectedSpecs.filter(s => s !== spec));
    } else {
      setSelectedSpecs([...selectedSpecs, spec]);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {technician ? 'Techniker bearbeiten' : 'Neuer Techniker'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Name</label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Max Mustermann"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">E-Mail</label>
              <Input
                type="email"
                value={formData.user_email}
                onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                placeholder="techniker@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Telefon</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+49 123 456789"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Rolle</label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Verfügbarkeitszeiten</label>
            <Input
              value={formData.availability_hours}
              onChange={(e) => setFormData({ ...formData, availability_hours: e.target.value })}
              placeholder="Mo-Fr 8:00-17:00"
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Fachgebiete</label>
            <div className="flex flex-wrap gap-2">
              {specializationOptions.map(spec => (
                <Badge
                  key={spec.value}
                  className={`cursor-pointer ${
                    selectedSpecs.includes(spec.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                  onClick={() => toggleSpecialization(spec.value)}
                >
                  {spec.label}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Zugewiesene Gebäude</label>
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {buildings.map(building => (
                <div
                  key={building.id}
                  onClick={() => toggleBuilding(building.id)}
                  className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{building.name}</span>
                    {selectedBuildings.includes(building.id) && (
                      <Badge className="bg-blue-600">Zugewiesen</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{building.address}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-semibold text-sm">Aktiv</p>
              <p className="text-xs text-slate-600">Kann Aufträge erhalten</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={() => saveMutation.mutate()}
              disabled={!formData.user_email || !formData.full_name || saveMutation.isPending}
              className="flex-1"
            >
              {saveMutation.isPending ? 'Speichert...' : 'Speichern'}
            </Button>
            <Button onClick={onClose} variant="outline">
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}