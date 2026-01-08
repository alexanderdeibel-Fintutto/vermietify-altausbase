import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, User, Lock, Eye } from 'lucide-react';

export default function PermissionDashboardPage() {
  const [selectedUser, setSelectedUser] = useState(null);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User?.list?.() || []
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.entities.Permission?.list?.() || []
  });

  const permissionGroups = {
    'Gebäude': ['create', 'read', 'update', 'delete'],
    'Mieter': ['create', 'read', 'update', 'delete'],
    'Verträge': ['create', 'read', 'update', 'delete'],
    'Finanzen': ['read', 'export'],
    'Berichte': ['read', 'export'],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🔐 Berechtigungen</h1>
        <p className="text-slate-600 mt-1">Überwachen und verwalten Sie Benutzerberechtigungen</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Benutzer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {users.map((user, idx) => (
              <div key={idx} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedUser(user)}>
                <p className="font-semibold text-slate-900">{user.full_name || '—'}</p>
                <p className="text-sm text-slate-600">{user.email}</p>
                <Badge className="mt-2 bg-blue-600">{user.role === 'admin' ? 'Admin' : 'User'}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Berechtigungsgruppen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(permissionGroups).map(([group, perms], idx) => (
              <div key={idx} className="p-3 border border-slate-200 rounded-lg">
                <p className="font-semibold text-slate-900 mb-2">{group}</p>
                <div className="flex gap-2 flex-wrap">
                  {perms.map((perm, pidx) => (
                    <Badge key={pidx} variant="outline">{perm}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5" /> Berechtigungen für {selectedUser.full_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(permissionGroups).map(([group, perms], idx) => (
                <div key={idx}>
                  <p className="font-semibold text-slate-900 mb-2">{group}</p>
                  <div className="flex gap-2 flex-wrap">
                    {perms.map((perm, pidx) => (
                      <div key={pidx} className="flex items-center gap-2">
                        <input type="checkbox" id={`${group}-${perm}`} defaultChecked={selectedUser.role === 'admin'} disabled={selectedUser.role === 'admin'} className="w-4 h-4" />
                        <label htmlFor={`${group}-${perm}`} className="text-sm text-slate-700">{perm}</label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}