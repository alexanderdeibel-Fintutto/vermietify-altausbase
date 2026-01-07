import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Save, UserX, Plus, Trash2, Star, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function UserDetail() {
  const { userId } = useParams();
  const [editedUser, setEditedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const users = await base44.asServiceRole.entities.User.filter({ id: userId });
      return users[0];
    }
  });

  const { data: userPermissions } = useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: async () => {
      const response = await base44.functions.invoke('getUserRolesAndPermissions', { userId });
      return response.data;
    },
    enabled: !!userId
  });

  const { data: allRoles = [] } = useQuery({
    queryKey: ['all-roles'],
    queryFn: () => base44.asServiceRole.entities.Role.list()
  });

  const { data: testSessions = [] } = useQuery({
    queryKey: ['user-test-sessions', userId],
    queryFn: () => base44.asServiceRole.entities.TestSession.filter({ user_id: userId }),
    enabled: !!user?.is_tester
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.asServiceRole.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      toast.success('Benutzer aktualisiert');
    }
  });

  const assignRoleMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('assignRoleToUser', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', userId] });
      setNewRole('');
      toast.success('Rolle zugewiesen');
    }
  });

  const removeRoleMutation = useMutation({
    mutationFn: (assignmentId) => base44.asServiceRole.entities.UserRoleAssignment.update(assignmentId, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', userId] });
      toast.success('Rolle entfernt');
    }
  });

  React.useEffect(() => {
    if (user) {
      setEditedUser(user);
    }
  }, [user]);

  if (!user || !editedUser) {
    return <div className="p-6">Lädt...</div>;
  }

  const userRoles = userPermissions?.roleAssignments || [];
  const availableRoles = allRoles.filter(role => 
    !userRoles.some(ur => ur.role_id === role.id)
  );

  const testerStats = {
    totalSessions: testSessions.length,
    totalTime: testSessions.reduce((sum, s) => sum + (s.total_duration || 0), 0),
    featuresTotal: new Set(testSessions.flatMap(s => s.features_tested || [])).size,
    averageRating: testSessions.filter(s => s.feedback_rating).length > 0
      ? (testSessions.reduce((sum, s) => sum + (s.feedback_rating || 0), 0) / testSessions.filter(s => s.feedback_rating).length).toFixed(1)
      : 0
  };

  const handleSaveChanges = () => {
    updateUserMutation.mutate({
      full_name: editedUser.full_name,
      is_tester: editedUser.is_tester
    });
  };

  const handleAddRole = () => {
    if (!newRole) return;
    assignRoleMutation.mutate({
      userId: user.id,
      roleId: newRole,
      validFrom: new Date().toISOString().split('T')[0]
    });
  };

  const getRoleVariant = (category) => {
    const variants = {
      admin: 'default',
      mitarbeiter: 'secondary',
      extern: 'outline',
      dienstleister: 'outline',
      testing: 'outline',
      custom: 'outline'
    };
    return variants[category] || 'outline';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="text-2xl">
              {user.full_name?.charAt(0) || user.email.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{user.full_name || user.email}</h1>
            <p className="text-slate-600">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveChanges} disabled={updateUserMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Änderungen speichern
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grunddaten */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Grunddaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input 
                value={editedUser.full_name || ""} 
                onChange={(e) => setEditedUser({...editedUser, full_name: e.target.value})}
              />
            </div>
            <div>
              <Label>E-Mail</Label>
              <Input value={user.email} disabled />
            </div>
            <div>
              <Label>Rolle (Base44)</Label>
              <Badge variant="outline">{user.role}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <Label>Tester-Account</Label>
              <Switch 
                checked={editedUser.is_tester || false}
                onCheckedChange={(checked) => setEditedUser({...editedUser, is_tester: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Rollen-Zuweisung */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rollen-Zuweisung</CardTitle>
            <CardDescription>Weisen Sie dem Benutzer Rollen zu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Neue Rolle hinzufügen */}
              <div className="flex gap-2">
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Rolle auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant={getRoleVariant(role.category)} className="text-xs">
                            {role.category}
                          </Badge>
                          {role.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddRole} disabled={!newRole || assignRoleMutation.isPending}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Bestehende Rollen */}
              <div className="space-y-2">
                {userRoles.map(assignment => (
                  <Card key={assignment.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={getRoleVariant(assignment.role?.category)}>
                          {assignment.role?.category}
                        </Badge>
                        <div>
                          <div className="font-medium">{assignment.role?.name}</div>
                          <div className="text-sm text-slate-500">{assignment.role?.description}</div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeRoleMutation.mutate(assignment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {assignment.building_restrictions && assignment.building_restrictions.length > 0 && (
                      <div className="mt-3">
                        <Label className="text-xs">Gebäude-Einschränkungen</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {assignment.building_restrictions.map(buildingId => {
                            const building = buildings.find(b => b.id === buildingId);
                            return (
                              <Badge key={buildingId} variant="outline" className="text-xs">
                                {building?.name || buildingId}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>
                        Gültig von: {format(new Date(assignment.valid_from), 'dd.MM.yyyy', { locale: de })}
                      </div>
                      <div>
                        Gültig bis: {assignment.valid_until ? format(new Date(assignment.valid_until), 'dd.MM.yyyy', { locale: de }) : 'Unbegrenzt'}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tester-Dashboard */}
      {user.is_tester && (
        <Card>
          <CardHeader>
            <CardTitle>Tester-Aktivitäten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{testerStats.totalSessions}</div>
                <div className="text-sm text-slate-600">Test-Sessions</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{Math.round(testerStats.totalTime / 60)}h</div>
                <div className="text-sm text-slate-600">Gesamt-Testzeit</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{testerStats.featuresTotal}</div>
                <div className="text-sm text-slate-600">Features getestet</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{testerStats.averageRating}</div>
                <div className="text-sm text-slate-600">Durchschnitt Bewertung</div>
              </div>
            </div>
            
            {/* Letzte Test-Sessions */}
            <div>
              <h4 className="font-medium mb-3">Letzte Test-Sessions</h4>
              <div className="space-y-2">
                {testSessions.slice(0, 5).map(session => (
                  <Card key={session.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {format(new Date(session.session_start), "dd.MM.yyyy HH:mm", { locale: de })}
                          {session.session_end && ` - ${format(new Date(session.session_end), "HH:mm", { locale: de })}`}
                        </div>
                        <div className="text-sm text-slate-600">
                          {Math.round(session.total_duration || 0)} Minuten • {session.pages_visited?.length || 0} Seiten • {session.actions_performed?.length || 0} Aktionen
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.feedback_rating && (
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < session.feedback_rating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`} 
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {session.features_tested && session.features_tested.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-slate-500 mb-1">Getestete Features:</div>
                        <div className="flex flex-wrap gap-1">
                          {session.features_tested.map(feature => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feld-Berechtigungen */}
      <FieldPermissionEditor userId={userId} />

      {/* Activity Log */}
      <ActivityLogViewer userId={userId} limit={50} />
    </div>
  );
}