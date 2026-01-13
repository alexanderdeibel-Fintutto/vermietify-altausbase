import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ChevronRight } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function OperatingCostWizardStep1({ onNext, selected }) {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Gebäude auswählen</h2>
        <p className="text-sm text-slate-600">Für welches Gebäude erstellen Sie die Betriebskostenabrechnung?</p>
      </div>

      <div className="grid gap-3">
        {buildings.map(building => (
          <Card 
            key={building.id} 
            className={`cursor-pointer transition-all ${selected?.id === building.id ? 'border-2 border-blue-500 bg-blue-50' : 'hover:border-blue-300'}`}
            onClick={() => onNext(building)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">{building.name}</p>
                  <p className="text-sm text-slate-500">{building.street} {building.house_number}</p>
                </div>
              </div>
              {selected?.id === building.id && <ChevronRight className="w-5 h-5 text-blue-600" />}
            </CardContent>
          </Card>
        ))}
      </div>

      {buildings.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          Keine Gebäude vorhanden. Erstellen Sie zuerst ein Gebäude.
        </div>
      )}
    </div>
  );
}