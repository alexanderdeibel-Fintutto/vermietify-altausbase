import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, UserPlus, Settings, Eye, BarChart3, 
  UserCheck, TestTube, Package 
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import InviteUserDialog from '../components/users/InviteUserDialog';
import UserSystemSetup from '../components/users/UserSystemSetup';

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const { data: roleAssignments = [] } = useQuery({
    queryKey: ['role-assignments'],
    queryFn: () => base44.asServiceRole.entities.UserRoleAssignment.list()
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.asServiceRole.entities.Role.list()
  });

  const { data: moduleAccess = [] } = useQuery({
    queryKey: ['module-access'],
    queryFn: () => base44.asServiceRole.entities.ModuleAccess.list()
  });

  const { data: testSessions = [] } = useQuery({
    queryKey: ['test-sessions'],
    queryFn: () => base44.asServiceRole.entities.TestSession.list()
  });

  // User-Daten mit Rollen und Modulen anreichern
  const enrichedUsers = users.map(user => {
    const userRoles = roleAssignments
      .filter(ra => ra.user_id === user.id && ra.is_active)
      .map(ra => roles.find(r => r.id === ra.role_id))
      .filter(r => r);
    
    const userModules = moduleAccess.filter(ma => ma.is_active);
    
    const userTestSessions = testSessions.filter(ts => ts.user_id === user.id);
    const totalTestTime = userTestSessions.reduce((sum, ts) => sum + (ts.total_duration || 0), 0);

    return {
      ...user,
      roles: userRoles,
      modules: userModules,
      test_sessions: userTestSessions,
      total_test_time: totalTestTime
    };
  });

  // Filtern
  const filteredUsers = enrichedUsers.filter(user => {
    if (searchTerm && !user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !user.email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterRole !== 'all' && !user.roles.some(r => r.category === filterRole)) {
      return false;
    }
    if (filterStatus === 'active' && user.role !== 'admin') return false;
    if (filterStatus === 'inactive' && user.role === 'admin') return false;
    
    return true;
  });

  // Statistiken
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.role === 'admin' || u.role === 'user').length,
    activeTesters: users.filter(u => u.is_tester).length,
    activeModules: moduleAccess.filter(ma => ma.is_active).length
  };

  const [setupDialogOpen, setSetupDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Benutzerverwaltung</h1>
          <p className="text-slate-600">Verwalten Sie Benutzer, Rollen und Berechtigungen</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setSetupDialogOpen(true)} 
            variant="outline"
          >
            <Settings className="w-4 h-4 mr-2" />
            System Setup
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setInviteDialogOpen(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Benutzer einladen
          </Button>
        </div>
      </div>

      {/* Filter und Suche */}
      <div className="flex gap-4 items-center">
        <Input 
          placeholder="Benutzer suchen..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Rolle filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Rollen</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
            <SelectItem value="mitarbeiter">Mitarbeiter</SelectItem>
            <SelectItem value="extern">Externe</SelectItem>
            <SelectItem value="testing">Tester</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="inactive">Inaktiv</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistik-Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Gesamt Benutzer</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Aktive Benutzer</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Tester aktiv</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeTesters}</p>
              </div>
              <TestTube className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Module gebucht</p>
                <p className="text-2xl font-bold text-purple-600">{stats.activeModules}</p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benutzer-Liste */}
      <Card>
        <CardHeader>
          <CardTitle>Benutzer ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar>
                    <AvatarFallback>{user.full_name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{user.full_name || user.email}</div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                    {user.is_tester && (
                      <Badge variant="outline" className="text-xs mt-1">
                        <TestTube className="w-3 h-3 mr-1" />
                        Tester
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {user.roles?.map(role => (
                      <Badge key={role.id} variant="secondary">
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm text-slate-600">
                    {user.modules?.length || 0} Module
                  </div>
                  {user.is_tester && user.total_test_time > 0 && (
                    <div className="text-sm">
                      <div className="font-medium">{Math.round(user.total_test_time / 60)}h</div>
                      <div className="text-xs text-slate-500">{user.test_sessions?.length || 0} Sessions</div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(createPageUrl('UserDetail') + '?userId=' + user.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(createPageUrl('UserDetail') + '?userId=' + user.id)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  {user.is_tester && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(createPageUrl('UserDetail') + '?userId=' + user.id)}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <InviteUserDialog 
        open={inviteDialogOpen} 
        onOpenChange={setInviteDialogOpen} 
      />

      {setupDialogOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-6">
          <div className="max-w-2xl w-full">
            <UserSystemSetup />
            <Button 
              variant="outline" 
              className="mt-4 w-full"
              onClick={() => setSetupDialogOpen(false)}
            >
              Schließen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}