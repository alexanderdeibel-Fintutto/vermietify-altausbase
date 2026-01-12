import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BuildingAccessManager({ userEmail }) {
  const [selectedRole, setSelectedRole] = useState('Objekt-Manager');
  const [selectedBuildings, setSelectedBuildings] = useState([]);
  
  const queryClient = useQueryClient();

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: userAccess = [] } = useQuery({
    queryKey: ['userAccess', userEmail],
    queryFn: () => base44.entities.UserMandantAccess.filter({ user_email: userEmail })
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roleDefinitions'],
    queryFn: () => base44.entities.RoleDefinition.list()
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const mandant = await base44.entities.Mandant.list().then(r => r[0]);
      
      return base44.entities.UserMandantAccess.create({
        user_email: userEmail,
        mandant_id: mandant.id,
        rolle: selectedRole,
        gebaeude_zugriff: JSON.stringify(selectedBuildings),
        berechtigungen: JSON.stringify({}),
        ist_aktiv: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userAccess']);
      toast.success('Zugriff gewährt');
      setSelectedBuildings([]);
    }
  });

  const removeMutation = useMutation({
    mutationFn: (accessId) => base44.entities.UserMandantAccess.delete(accessId),
    onSuccess: () => {
      queryClient.invalidateQueries(['userAccess']);
      toast.success('Zugriff entfernt');
    }
  });

  const toggleBuilding = (buildingId) => {
    setSelectedBuildings(prev => 
      prev.includes(buildingId) 
        ? prev.filter(id => id !== buildingId)
        : [...prev, buildingId]
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-base">Gebäudezugriff</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Access */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Aktive Zugriffe:</p>
          {userAccess.length === 0 && (
            <p className="text-sm text-slate-500">Keine Zugriffe konfiguriert</p>
          )}
          {userAccess.map(access => {
            const buildingIds = JSON.parse(access.gebaeude_zugriff || '[]');
            const buildingNames = buildingIds.map(id => 
              buildings.find(b => b.id === id)?.name || 'Unbekannt'
            );

            return (
              <div key={access.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <div>
                  <Badge className="bg-blue-100 text-blue-700">{access.rolle}</Badge>
                  <p className="text-xs text-slate-600 mt-1">
                    {buildingIds.length === 0 ? 'Alle Gebäude' : buildingNames.join(', ')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeMutation.mutate(access.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Add New Access */}
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">Neuen Zugriff hinzufügen:</p>
          
          <div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.rolle_name}>
                    {role.rolle_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-600">Gebäude auswählen (leer = alle):</p>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {buildings.map(building => (
                <label key={building.id} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer">
                  <Checkbox
                    checked={selectedBuildings.includes(building.id)}
                    onCheckedChange={() => toggleBuilding(building.id)}
                  />
                  <span className="text-sm">{building.name}</span>
                </label>
              ))}
            </div>
          </div>

          <Button 
            onClick={() => assignMutation.mutate()}
            disabled={assignMutation.isPending}
            className="w-full"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Zugriff gewähren
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}