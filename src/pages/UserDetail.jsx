import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Shield, Activity, Calendar, TestTube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function UserDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('userId');

  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const users = await base44.asServiceRole.entities.User.filter({ id: userId });
      return users[0];
    },
    enabled: !!userId
  });

  const { data: userPermissions } = useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: async () => {
      const response = await base44.functions.invoke('getUserRolesAndPermissions', { userId });
      return response.data;
    },
    enabled: !!userId
  });

  const { data: userActivity = [] } = useQuery({
    queryKey: ['user-activity', userId],
    queryFn: () => base44.asServiceRole.entities.UserActivity.filter({ user_id: userId }),
    enabled: !!userId
  });

  const { data: testSessions = [] } = useQuery({
    queryKey: ['test-sessions', userId],
    queryFn: () => base44.asServiceRole.entities.TestSession.filter({ user_id: userId }),
    enabled: !!userId && user?.is_tester
  });

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate(createPageUrl('UserManagement'))}>
        ← Zurück
      </Button>

      <div className="flex items-start gap-6">
        <Avatar className="w-20 h-20">
          <AvatarFallback className="text-2xl">
            {user.full_name?.charAt(0) || user.email.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{user.full_name || user.email}</h1>
          <p className="text-slate-600">{user.email}</p>
          <div className="flex gap-2 mt-3">
            <Badge>{user.role}</Badge>
            {user.is_tester && (
              <Badge variant="secondary">
                <TestTube className="w-3 h-3 mr-1" />
                Tester
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="permissions">Berechtigungen</TabsTrigger>
          <TabsTrigger value="activity">Aktivität</TabsTrigger>
          {user.is_tester && <TabsTrigger value="testing">Testing</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Benutzer-Informationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">E-Mail</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Rolle</span>
                <Badge>{user.role}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Erstellt am</span>
                <span className="font-medium">
                  {new Date(user.created_date).toLocaleDateString('de-DE')}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Rollen</p>
                    <p className="text-2xl font-bold">{userPermissions?.roles.length || 0}</p>
                  </div>
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Berechtigungen</p>
                    <p className="text-2xl font-bold">{userPermissions?.permissions.length || 0}</p>
                  </div>
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Aktivitäten</p>
                    <p className="text-2xl font-bold">{userActivity.length}</p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Zugewiesene Rollen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userPermissions?.roles.map(role => (
                  <div key={role.id} className="p-3 border rounded-lg">
                    <div className="font-medium">{role.name}</div>
                    <div className="text-sm text-slate-600">{role.description}</div>
                    <Badge variant="secondary" className="mt-2">{role.category}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Berechtigungen ({userPermissions?.permissions.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {userPermissions?.permissions.map(perm => (
                  <div key={perm.id} className="p-2 border rounded text-sm">
                    <div className="font-medium">{perm.name}</div>
                    <Badge variant="outline" className="text-xs mt-1">{perm.code}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Letzte Aktivitäten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userActivity.slice(0, 20).map(activity => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 border-b">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{activity.action_type}</div>
                      <div className="text-xs text-slate-600">{activity.resource}</div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(activity.created_date).toLocaleString('de-DE')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {user.is_tester && (
          <TabsContent value="testing" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Test-Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testSessions.map(session => (
                    <div key={session.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">
                          {new Date(session.session_start).toLocaleDateString('de-DE')}
                        </span>
                        <Badge>{session.total_duration || 0} Min</Badge>
                      </div>
                      <div className="text-sm text-slate-600">
                        {session.features_tested?.length || 0} Features getestet
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}