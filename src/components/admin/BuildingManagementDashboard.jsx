import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BuildingManagementDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const { data: buildings = [] } = useQuery({
    queryKey: ['allBuildings'],
    queryFn: () => base44.entities.Building.list('-created_date')
  });

  const { data: units = [] } = useQuery({
    queryKey: ['allUnits'],
    queryFn: () => base44.entities.Unit.list()
  });

  const filteredBuildings = buildings.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.address && b.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getBuildingStats = (buildingId) => {
    const buildingUnits = units.filter(u => u.gebaeude_id === buildingId);
    return {
      totalUnits: buildingUnits.length,
      totalArea: buildingUnits.reduce((sum, u) => sum + (u.sqm || 0), 0)
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gebäude Verwaltung</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Nach Name oder Adresse suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBuildings.map(building => {
          const stats = getBuildingStats(building.id);
          return (
            <Card key={building.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{building.name}</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">
                      {building.address} {building.house_number}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-slate-600">Wohneinheiten</p>
                      <p className="font-bold text-lg">{stats.totalUnits}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Gesamtfläche</p>
                      <p className="font-bold text-lg">{stats.totalArea} m²</p>
                    </div>
                    <div>
                      <p className="text-slate-600">PLZ</p>
                      <p className="font-bold">{building.postal_code}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Ort</p>
                      <p className="font-bold">{building.city}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <Button variant="outline" size="sm" className="gap-2 flex-1">
                      <Eye className="w-4 h-4" />
                      Ansicht
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 flex-1">
                      <Edit2 className="w-4 h-4" />
                      Bearbeiten
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}