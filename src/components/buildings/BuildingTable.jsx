import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BuildingTable({ buildings = [], unitsMap = {}, contractsMap = {} }) {
  const navigate = useNavigate();

  return (
    <div className="vf-table-container">
      <table className="vf-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Adresse</th>
            <th>Einheiten</th>
            <th>Belegt</th>
            <th>Auslastung</th>
            <th className="text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {buildings.map((building) => {
            const units = unitsMap[building.id] || [];
            const activeContracts = contractsMap[building.id] || [];
            const occupancy = units.length > 0 
              ? Math.round((activeContracts.length / units.length) * 100) 
              : 0;

            return (
              <tr key={building.id}>
                <td className="font-medium">{building.name}</td>
                <td>
                  {building.address && (
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-[var(--theme-text-muted)]" />
                      {building.address}
                    </div>
                  )}
                </td>
                <td>{units.length}</td>
                <td>{activeContracts.length}</td>
                <td>
                  <span className={occupancy >= 90 ? 'text-[var(--vf-success-600)]' : ''}>
                    {occupancy}%
                  </span>
                </td>
                <td className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(createPageUrl('BuildingDetail') + `?id=${building.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}