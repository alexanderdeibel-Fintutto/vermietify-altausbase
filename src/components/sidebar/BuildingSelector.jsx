import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSelectedBuilding } from '@/components/hooks/useSelectedBuilding';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function BuildingSelector() {
  const { selectedBuilding, setSelectedBuilding } = useSelectedBuilding();
  
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(),
  });

  const currentBuilding = buildings.find(b => b.id === selectedBuilding);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-sm"
          style={{
            borderColor: currentBuilding?.theme_color || '#e2e8f0',
            backgroundColor: currentBuilding?.theme_color ? `${currentBuilding.theme_color}08` : 'transparent',
          }}
        >
          <span className="truncate text-left font-medium">
            {currentBuilding?.name || 'Gebäude wählen'}
          </span>
          <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {buildings.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-slate-500">
            Keine Gebäude vorhanden
          </div>
        ) : (
          buildings.map((building) => (
            <DropdownMenuItem
              key={building.id}
              onClick={() => setSelectedBuilding(building.id)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {building.theme_color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: building.theme_color }}
                    />
                  )}
                  <span>{building.name}</span>
                </div>
                {selectedBuilding === building.id && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}