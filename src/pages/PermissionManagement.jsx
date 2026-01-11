import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import UserPermissionCard from '@/components/permissions/UserPermissionCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function PermissionManagement() {
  const { data: users, isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ['users:permissions'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: buildings, isLoading: isLoadingBuildings, error: buildingsError } = useQuery({
    queryKey: ['buildings:permissions'],
    queryFn: () => base44.entities.Building.list(),
  });
  
  const { data: permissions, isLoading: isLoadingPermissions, error: permissionsError } = useQuery({
    queryKey: ['buildingPermissions'],
    queryFn: () => base44.entities.BuildingPermission.list(),
  });

  const isLoading = isLoadingUsers || isLoadingBuildings || isLoadingPermissions;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Gebäudeberechtigungen
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Weisen Sie Benutzern spezifische Lese- oder Schreibrechte für einzelne Gebäude zu.
        </p>

        <div className="mt-8 space-y-6">
          {isLoading && (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          )}

          {!isLoading && users?.map(user => (
            <UserPermissionCard 
              key={user.id} 
              user={user} 
              buildings={buildings || []}
              permissions={permissions?.filter(p => p.user_email === user.email) || []}
            />
          ))}

          {!isLoading && (!users || users.length === 0) && (
             <p className="text-center text-gray-500">Keine Benutzer gefunden.</p>
          )}
        </div>
      </div>
    </div>
  );
}