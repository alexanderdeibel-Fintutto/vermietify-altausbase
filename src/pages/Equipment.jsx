import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import EquipmentForm from '@/components/equipment/EquipmentForm';
import EquipmentTable from '@/components/equipment/EquipmentTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

export default function Equipment() {
  const [showForm, setShowForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const queryClient = useQueryClient();

  // Fetch equipment
  const { data: equipmentList = [], isLoading: equipmentLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list('-updated_date', 100),
  });

  // Fetch buildings for reference
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list('-updated_date', 50),
  });

  // Create/Update equipment
  const createMutation = useMutation({
    mutationFn: (data) => {
      if (editingEquipment) {
        return base44.entities.Equipment.update(editingEquipment.id, data);
      }
      return base44.entities.Equipment.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setShowForm(false);
      setEditingEquipment(null);
    },
  });

  // Delete equipment
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Equipment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });

  // Filter and search
  const filtered = useMemo(() => {
    return equipmentList.filter(item => {
      const matchesSearch = !searchQuery || 
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = !filterType || item.equipment_type === filterType;
      const matchesStatus = !filterStatus || item.status === filterStatus;
      const matchesBuilding = !filterBuilding || item.building_id === filterBuilding;

      return matchesSearch && matchesType && matchesStatus && matchesBuilding;
    });
  }, [equipmentList, searchQuery, filterType, filterStatus, filterBuilding]);

  // Build building reference map
  const buildingMap = buildings.reduce((acc, b) => {
    acc[b.id] = b;
    return acc;
  }, {});

  const handleSubmit = (data) => {
    createMutation.mutate(data);
  };

  const handleEdit = (equipment) => {
    setEditingEquipment(equipment);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEquipment(null);
  };

  // Stats
  const stats = {
    total: equipmentList.length,
    active: equipmentList.filter(e => e.status === 'active').length,
    maintenance_needed: equipmentList.filter(e => {
      if (!e.next_maintenance_date) return false;
      return new Date(e.next_maintenance_date) < new Date();
    }).length,
    defective: equipmentList.filter(e => e.status === 'defective').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Geräte & Inventar</h1>
          <p className="text-slate-600 font-light mt-2">Verwalten Sie alle Geräte und Anlagen in Ihren Gebäuden</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 font-light gap-2"
        >
          <Plus className="w-4 h-4" />
          Neues Gerät
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm font-light text-slate-600">Insgesamt</p>
          <p className="text-2xl font-light text-slate-900 mt-1">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-light text-slate-600">Aktiv</p>
          <p className="text-2xl font-light text-green-600 mt-1">✅ {stats.active}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-light text-slate-600">Wartung fällig</p>
          <p className="text-2xl font-light text-red-600 mt-1">⚠️ {stats.maintenance_needed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-light text-slate-600">Defekt</p>
          <p className="text-2xl font-light text-red-600 mt-1">❌ {stats.defective}</p>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <EquipmentForm
          equipment={editingEquipment}
          buildings={buildings}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Nach Name, Seriennummer, Hersteller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 font-light"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>

          <Select value={filterBuilding} onValueChange={setFilterBuilding}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Gebäude" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle Gebäude</SelectItem>
              {buildings.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Typ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle Typen</SelectItem>
              <SelectItem value="heating_system">🔥 Heizung</SelectItem>
              <SelectItem value="cooling_system">❄️ Kühlung</SelectItem>
              <SelectItem value="elevator">🛗 Aufzug</SelectItem>
              <SelectItem value="pump">💧 Pumpe</SelectItem>
              <SelectItem value="boiler">🫖 Kessel</SelectItem>
              <SelectItem value="generator">⚡ Generator</SelectItem>
              <SelectItem value="water_heater">🌡️ Warmwasser</SelectItem>
              <SelectItem value="ventilation">💨 Lüftung</SelectItem>
              <SelectItem value="other">📦 Sonstiges</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle Status</SelectItem>
              <SelectItem value="active">✅ Aktiv</SelectItem>
              <SelectItem value="inactive">⭕ Inaktiv</SelectItem>
              <SelectItem value="maintenance">🔧 In Wartung</SelectItem>
              <SelectItem value="defective">❌ Defekt</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Equipment List */}
      <div>
        <p className="text-sm font-light text-slate-600 mb-3">
          {filtered.length} von {equipmentList.length} Geräten
        </p>
        <EquipmentTable
          equipment={filtered}
          buildings={buildingMap}
          onEdit={handleEdit}
          onDelete={(id) => {
            if (confirm('Dieses Gerät wirklich löschen?')) {
              deleteMutation.mutate(id);
            }
          }}
          loading={equipmentLoading}
        />
      </div>
    </div>
  );
}