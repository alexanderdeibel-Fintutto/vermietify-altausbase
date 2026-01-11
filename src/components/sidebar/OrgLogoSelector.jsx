import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSelectedBuilding } from '@/components/hooks/useSelectedBuilding';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function OrgLogoSelector() {
  const { selectedBuilding, setSelectedBuilding } = useSelectedBuilding();

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(),
  });

  const currentBuilding = buildings.find(b => b.id === selectedBuilding);
  const themeColor = currentBuilding?.theme_color || '#1e293b';

  // Generate initials from building name
  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'ORG';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs hover:opacity-80 transition-opacity"
          style={{ backgroundColor: themeColor }}
          title={currentBuilding?.name || 'Organisation'}
        >
          {getInitials(currentBuilding?.name)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {buildings.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-slate-500">
            Keine Gebäude vorhanden
          </div>
        ) : (
          buildings.map((building) => (
            <DropdownMenuItem
              key={building.id}
              onClick={() => setSelectedBuilding(building.id)}
              className="cursor-pointer flex items-center gap-2"
            >
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                style={{ backgroundColor: building.theme_color || '#1e293b' }}
              >
                {getInitials(building.name)}
              </div>
              <span className="flex-1">{building.name}</span>
              {selectedBuilding === building.id && (
                <div className="w-2 h-2 rounded-full bg-green-600" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}