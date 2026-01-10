import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap } from 'lucide-react';
import EnergyAnalysisDashboard from '@/components/energy/EnergyAnalysisDashboard';
import HeatingOptimizationPanel from '@/components/energy/HeatingOptimizationPanel';

export default function EnergyManagement() {
  const [selectedBuilding, setSelectedBuilding] = useState('');

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Energie-Management</h1>
            <p className="text-slate-600">KI-gestützte Verbrauchsanalyse und -optimierung</p>
          </div>
        </div>
        <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Gebäude wählen" />
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

      {!selectedBuilding ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Zap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Bitte wählen Sie ein Gebäude aus</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <EnergyAnalysisDashboard buildingId={selectedBuilding} />
          <HeatingOptimizationPanel buildingId={selectedBuilding} />
        </>
      )}
    </div>
  );
}