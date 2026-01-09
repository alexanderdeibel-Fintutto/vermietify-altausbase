import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Home, Plus, Edit, Eye, Upload } from 'lucide-react';
import UnitDetailDialog from '@/components/building-detail/UnitDetailDialog';
import UnitEditDialog from '@/components/building-detail/UnitEditDialog';

export default function BuildingUnitsManager({ buildingId, units }) {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [editingUnit, setEditingUnit] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const statusColors = {
    occupied: 'bg-green-100 text-green-800',
    vacant: 'bg-amber-100 text-amber-800',
    renovation: 'bg-blue-100 text-blue-800'
  };

  const statusLabels = {
    occupied: 'Belegt',
    vacant: 'Frei',
    renovation: 'Renovierung'
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-light text-slate-900">Einheitenverwaltung</h2>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neue Einheit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.map(unit => (
          <Card key={unit.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-slate-600" />
                  <CardTitle className="text-base">Einheit {unit.unit_number}</CardTitle>
                </div>
                <Badge className={statusColors[unit.status]}>
                  {statusLabels[unit.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-slate-600">Etage</p>
                  <p className="font-semibold">{unit.floor || 0}</p>
                </div>
                <div>
                  <p className="text-slate-600">Fläche</p>
                  <p className="font-semibold">{unit.sqm} m²</p>
                </div>
                <div>
                  <p className="text-slate-600">Zimmer</p>
                  <p className="font-semibold">{unit.rooms || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-600">Miete</p>
                  <p className="font-semibold text-blue-600">{unit.base_rent || 0}€</p>
                </div>
              </div>

              <div className="flex gap-2 text-xs">
                {unit.has_balcony && <Badge variant="outline">Balkon</Badge>}
                {unit.has_fitted_kitchen && <Badge variant="outline">Küche</Badge>}
                {unit.has_parking && <Badge variant="outline">Parkplatz</Badge>}
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedUnit(unit)} className="flex-1">
                  <Eye className="w-3 h-3 mr-1" />
                  Details
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingUnit(unit)}>
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedUnit && (
        <UnitDetailDialog unit={selectedUnit} onClose={() => setSelectedUnit(null)} />
      )}

      {(editingUnit || showCreateDialog) && (
        <UnitEditDialog
          buildingId={buildingId}
          unit={editingUnit}
          onClose={() => {
            setEditingUnit(null);
            setShowCreateDialog(false);
          }}
        />
      )}
    </div>
  );
}