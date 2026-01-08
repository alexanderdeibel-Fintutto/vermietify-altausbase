import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield, Package, Activity, Key, Database, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import StatCard from '@/components/shared/StatCard';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.asServiceRole.entities.Role.list()
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.asServiceRole.entities.Permission.list()
  });

  const { data: moduleAccess = [] } = useQuery({
    queryKey: ['module-access'],
    queryFn: () => base44.asServiceRole.entities.ModuleAccess.list()
  });

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => base44.asServiceRole.entities.APIKey.list()
  });

  const { data: testSessions = [] } = useQuery({
    queryKey: ['test-sessions'],
    queryFn: () => base44.asServiceRole.entities.TestSession.list()
  });

  const quickLinks = [
    { name: 'Benutzerverwaltung', icon: Users, page: 'UserManagement' },
    { name: 'Rollen', icon: Shield, page: 'RoleManagement' },
    { name: 'Module', icon: Package, page: 'ModuleManagement' },
    { name: 'Activity Logs', icon: Activity, page: 'ActivityLogs' },
    { name: 'API Keys', icon: Key, page: 'APIKeyManagement' },
    { name: 'System Health', icon: Database, page: 'SystemHealth' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600">Zentrale Verwaltung und Übersicht</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Benutzer"
          value={users.length}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Rollen"
          value={roles.length}
          icon={Shield}
          color="purple"
        />
        <StatCard
          title="Permissions"
          value={permissions.length}
          icon={Shield}
          color="green"
        />
        <StatCard
          title="Module"
          value={moduleAccess.filter(ma => ma.is_active).length}
          icon={Package}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="API Keys"
          value={apiKeys.length}
          icon={Key}
          color="red"
        />
        <StatCard
          title="Test Sessions"
          value={testSessions.length}
          icon={Activity}
          color="emerald"
        />
        <StatCard
          title="Aktive Tester"
          value={users.filter(u => u.is_tester).length}
          icon={Users}
          color="blue"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {quickLinks.map((link) => (
              <Button
                key={link.page}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => navigate(createPageUrl(link.page))}
              >
                <link.icon className="w-6 h-6" />
                <span className="text-sm">{link.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System-Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Aktive Rollen</span>
              <span className="font-bold">{roles.filter(r => r.is_active).length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Admin-Benutzer</span>
              <span className="font-bold">{users.filter(u => u.role === 'admin').length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Aktive API Keys</span>
              <span className="font-bold">{apiKeys.filter(k => k.is_active).length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}