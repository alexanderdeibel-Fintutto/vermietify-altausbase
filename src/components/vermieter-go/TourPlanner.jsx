import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Navigation, CheckCircle } from 'lucide-react';

export default function TourPlanner() {
  const [selectedBuildings, setSelectedBuildings] = useState([]);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list('-name', 100)
  });

  const { data: todayTasks = [] } = useQuery({
    queryKey: ['todayTasks'],
    queryFn: () => base44.entities.BuildingTask.filter(
      { status: { $in: ['open', 'assigned', 'in_progress'] } },
      'priority',
      50
    )
  });

  const buildingsWithTasks = buildings.map(b => ({
    ...b,
    taskCount: todayTasks.filter(t => t.building_id === b.id).length
  })).filter(b => b.taskCount > 0);

  const toggleBuilding = (id) => {
    setSelectedBuildings(prev =>
      prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
    );
  };

  const startTour = () => {
    if (selectedBuildings.length === 0) return;
    
    const addresses = selectedBuildings
      .map(id => buildings.find(b => b.id === id))
      .map(b => `${b.street} ${b.house_number}, ${b.postal_code} ${b.city}`)
      .join('/');
    
    const encoded = encodeURIComponent(addresses);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Tour-Planer
          {selectedBuildings.length > 0 && (
            <Badge>{selectedBuildings.length} ausgewählt</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {buildingsWithTasks.map(building => (
            <button
              key={building.id}
              onClick={() => toggleBuilding(building.id)}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                selectedBuildings.includes(building.id)
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{building.name}</p>
                  <p className="text-xs text-slate-600">{building.street}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-100 text-orange-800">
                    {building.taskCount} Tasks
                  </Badge>
                  {selectedBuildings.includes(building.id) && (
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedBuildings.length > 0 && (
          <Button onClick={startTour} className="w-full bg-blue-600 hover:bg-blue-700">
            <Navigation className="w-4 h-4 mr-2" />
            Tour starten ({selectedBuildings.length} Stopps)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}