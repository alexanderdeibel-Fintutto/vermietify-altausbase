import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit } from 'lucide-react';
import AddPermissionDialog from './AddPermissionDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function UserPermissionCard({ user, buildings, permissions }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const deletePermissionMutation = useMutation({
    mutationFn: (permissionId) => base44.entities.BuildingPermission.delete(permissionId),
    onSuccess: () => {
      toast.success('Berechtigung entfernt.');
      queryClient.invalidateQueries({ queryKey: ['buildingPermissions'] });
    },
    onError: (error) => {
      toast.error('Fehler beim Entfernen der Berechtigung: ' + error.message);
    }
  });

  const getBuildingName = (buildingId) => {
    return buildings.find(b => b.id === buildingId)?.name || 'Unbekanntes Gebäude';
  };

  if (user.role === 'admin') {
    return (
      <Card className="bg-slate-50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{user.full_name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
          <Badge variant="secondary">Administrator</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Administratoren haben automatisch vollen Zugriff auf alle Gebäude.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{user.full_name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          {permissions.length === 0 ? (
            <p className="text-sm text-slate-500">Dieser Benutzer hat keine spezifischen Gebäudeberechtigungen.</p>
          ) : (
            <div className="space-y-2">
              {permissions.map(permission => (
                <div key={permission.id} className="flex items-center justify-between p-2 rounded-md bg-slate-50">
                  <div>
                    <p className="font-medium">{getBuildingName(permission.building_id)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <Badge variant={permission.permission_level === 'write' ? 'default' : 'secondary'}>
                        {permission.permission_level === 'write' ? 'Schreibzugriff' : 'Lesezugriff'}
                      </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => deletePermissionMutation.mutate(permission.id)}
                      disabled={deletePermissionMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Berechtigung hinzufügen
          </Button>
        </CardFooter>
      </Card>
      <AddPermissionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        user={user}
        buildings={buildings}
        existingPermissions={permissions}
      />
    </>
  );
}