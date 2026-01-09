import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, MapPin, ArrowRight } from 'lucide-react';

export default function MeterChecklistMode({ meters, onMeterSelect, completedMeterIds = [] }) {
  const [expandedBuilding, setExpandedBuilding] = useState(null);

  // Group by building and floor
  const metersByBuilding = meters.reduce((acc, meter) => {
    const buildingId = meter.building_id || 'unknown';
    if (!acc[buildingId]) {
      acc[buildingId] = {
        name: meter.building_name || 'Unbekannt',
        floors: {}
      };
    }

    const floor = extractFloor(meter.location);
    if (!acc[buildingId].floors[floor]) {
      acc[buildingId].floors[floor] = [];
    }
    acc[buildingId].floors[floor].push(meter);

    return acc;
  }, {});

  const totalMeters = meters.length;
  const completedCount = completedMeterIds.length;
  const progress = (completedCount / totalMeters) * 100;

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-green-100">Checklisten-Modus</p>
              <p className="text-2xl font-bold">{completedCount} / {totalMeters}</p>
            </div>
            <Badge className="bg-white text-green-900">
              {Math.round(progress)}%
            </Badge>
          </div>
          <Progress value={progress} className="h-2 bg-green-400" />
        </CardContent>
      </Card>

      {/* Checklist by Building */}
      {Object.entries(metersByBuilding).map(([buildingId, building]) => {
        const buildingMeters = Object.values(building.floors).flat();
        const buildingCompleted = buildingMeters.filter(m => completedMeterIds.includes(m.id)).length;
        const buildingProgress = (buildingCompleted / buildingMeters.length) * 100;

        return (
          <Card key={buildingId}>
            <CardHeader 
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => setExpandedBuilding(expandedBuilding === buildingId ? null : buildingId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold">{building.name}</p>
                    <p className="text-sm text-slate-600">
                      {buildingCompleted}/{buildingMeters.length} Zähler
                    </p>
                  </div>
                </div>
                <Badge className={
                  buildingProgress === 100 ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }>
                  {Math.round(buildingProgress)}%
                </Badge>
              </div>
              <Progress value={buildingProgress} className="mt-2" />
            </CardHeader>

            {expandedBuilding === buildingId && (
              <CardContent>
                {Object.entries(building.floors).sort((a, b) => b[0] - a[0]).map(([floor, floorMeters]) => (
                  <div key={floor} className="mb-4 last:mb-0">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      {floor === '-1' ? 'Untergeschoss' : 
                       floor === '0' ? 'Erdgeschoss' : 
                       `${floor}. Obergeschoss`}
                    </p>
                    <div className="space-y-2">
                      {floorMeters.map(meter => {
                        const isCompleted = completedMeterIds.includes(meter.id);
                        return (
                          <div
                            key={meter.id}
                            onClick={() => !isCompleted && onMeterSelect(meter)}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                              isCompleted 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isCompleted ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-400" />
                              )}
                              <div>
                                <p className="font-semibold text-sm">{meter.meter_number}</p>
                                <p className="text-xs text-slate-600">{meter.location}</p>
                              </div>
                            </div>
                            {!isCompleted && (
                              <ArrowRight className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function extractFloor(location) {
  if (!location) return '0';
  if (location.includes('UG')) return '-1';
  if (location.includes('EG')) return '0';
  const match = location.match(/(\d+)\.\s*OG/i);
  return match ? match[1] : '0';
}