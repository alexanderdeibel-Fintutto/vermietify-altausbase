import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Plus, Settings } from 'lucide-react';
import { toast } from 'sonner';
import TechnicianFormDialog from '@/components/technicians/TechnicianFormDialog';
import TechnicianCard from '@/components/technicians/TechnicianCard';

export default function TechnicianManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState(null);
  const queryClient = useQueryClient();

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ['building-managers'],
    queryFn: () => base44.entities.BuildingManager.list()
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.BuildingManager.delete({ id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['building-managers']);
      toast.success('Techniker gelöscht');
    }
  });

  const handleEdit = (technician) => {
    setEditingTechnician(technician);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingTechnician(null);
  };

  const activeTechnicians = technicians.filter(t => t.is_active);
  const inactiveTechnicians = technicians.filter(t => !t.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Techniker-Verwaltung</h1>
            <p className="text-slate-600">
              Verwalten Sie Techniker, Hausmeister und deren Zuständigkeiten
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Techniker hinzufügen
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold">{activeTechnicians.length}</div>
            <p className="text-slate-600 text-sm">Aktive Techniker</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold">
              {technicians.reduce((sum, t) => sum + (t.assigned_buildings?.length || 0), 0)}
            </div>
            <p className="text-slate-600 text-sm">Zugewiesene Gebäude</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold">
              {new Set(technicians.flatMap(t => t.specializations || [])).size}
            </div>
            <p className="text-slate-600 text-sm">Fachgebiete abgedeckt</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Aktive Techniker</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTechnicians.map(technician => (
              <TechnicianCard
                key={technician.id}
                technician={technician}
                onEdit={handleEdit}
                onDelete={deleteMutation.mutate}
              />
            ))}
            {activeTechnicians.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center">
                  <p className="text-slate-600">Keine aktiven Techniker</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {inactiveTechnicians.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Inaktive Techniker</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveTechnicians.map(technician => (
                <TechnicianCard
                  key={technician.id}
                  technician={technician}
                  onEdit={handleEdit}
                  onDelete={deleteMutation.mutate}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <TechnicianFormDialog
          technician={editingTechnician}
          onClose={handleClose}
        />
      )}
    </div>
  );
}