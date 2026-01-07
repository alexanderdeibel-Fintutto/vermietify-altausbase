import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import PermissionTester from '../components/permissions/PermissionTester';
import ModuleAccessMatrix from '../components/modules/ModuleAccessMatrix';
import { Shield, Users, Lock, Activity } from 'lucide-react';

export default function PermissionDashboard() {
  const { data: roles = [] } = useQuery({
    queryKey: ['all-roles'],
    queryFn: () => base44.asServiceRole.entities.Role.list()
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['all-permissions'],
    queryFn: () => base44.asServiceRole.entities.Permission.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const allUsers = await base44.asServiceRole.entities.User.list();
      return allUsers;
    }
  });

  const { data: roleAssignments = [] } = useQuery({
    queryKey: ['role-assignments'],
    queryFn: () => base44.asServiceRole.entities.UserRoleAssignment.list()
  });

  const activeRoles = roles.filter(r => r.is_active);
  const activePermissions = permissions.filter(p => p.is_active);
  const activeAssignments = roleAssignments.filter(ra => ra.is_active);

  // Gruppiere Permissions nach Modul
  const permissionsByModule = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Permission Dashboard</h1>
        <p className="text-slate-600">Übersicht über Rollen, Berechtigungen und Zugriffe</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{activeRoles.length}</div>
                <div className="text-sm text-slate-600">Aktive Rollen</div>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{activePermissions.length}</div>
                <div className="text-sm text-slate-600">Berechtigungen</div>
              </div>
              <Lock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">{users.length}</div>
                <div className="text-sm text-slate-600">Benutzer</div>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">{activeAssignments.length}</div>
                <div className="text-sm text-slate-600">Zuweisungen</div>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="modules">Module</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="tester">Tester</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PermissionTester />
          
          <Card>
            <CardHeader>
              <CardTitle>Rollen-Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map(role => (
                  <Card key={role.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{role.category}</Badge>
                        {!role.is_active && <Badge variant="secondary">Inaktiv</Badge>}
                      </div>
                      <div className="font-medium">{role.name}</div>
                      <div className="text-sm text-slate-600">{role.description}</div>
                      <div className="text-xs text-slate-500 mt-2">
                        {role.permissions?.length || 0} Berechtigungen
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <ModuleAccessMatrix />
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Berechtigungen nach Modul</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module}>
                    <h3 className="font-semibold text-lg mb-3">{module}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {perms.map(perm => (
                        <Card key={perm.id}>
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{perm.name}</div>
                                <div className="text-xs text-slate-600">{perm.description}</div>
                                <div className="flex gap-1 mt-2">
                                  <Badge variant="outline" className="text-xs">{perm.resource}</Badge>
                                  <Badge variant="outline" className="text-xs">{perm.action}</Badge>
                                </div>
                              </div>
                              {!perm.is_active && <Badge variant="secondary" className="text-xs">Inaktiv</Badge>}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tester">
          <Card>
            <CardHeader>
              <CardTitle>Tester-Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.filter(u => u.is_tester).map(user => (
                  <div key={user.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{user.full_name || user.email}</div>
                        <div className="text-sm text-slate-600">{user.email}</div>
                      </div>
                      <Badge>Tester</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}