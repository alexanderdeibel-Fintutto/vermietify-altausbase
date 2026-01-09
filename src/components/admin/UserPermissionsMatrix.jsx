import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';

export default function UserPermissionsMatrix() {
  const [searchUser, setSearchUser] = useState('');

  const { data: deptMembers, isLoading: loadingMembers } = useQuery({
    queryKey: ['memberPermissions'],
    queryFn: async () => {
      try {
        return await base44.entities.DepartmentMember.filter(
          { is_active: true },
          null,
          200
        );
      } catch {
        return [];
      }
    }
  });

  const { data: roles, isLoading: loadingRoles } = useQuery({
    queryKey: ['rolesMatrix'],
    queryFn: async () => {
      try {
        return await base44.entities.UserRole.list(null, 100);
      } catch {
        return [];
      }
    }
  });

  const filtered = deptMembers?.filter(m =>
    m.user_email.includes(searchUser) || m.user_name?.includes(searchUser)
  ) || [];

  if (loadingMembers || loadingRoles) {
    return <Loader2 className="w-6 h-6 animate-spin" />;
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Nach Benutzer filtern..."
        value={searchUser}
        onChange={(e) => setSearchUser(e.target.value)}
        className="max-w-md"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3 font-semibold">Benutzer</th>
              <th className="text-left py-2 px-3 font-semibold">Abteilung</th>
              <th className="text-left py-2 px-3 font-semibold">Rolle</th>
              {roles?.slice(0, 5).map(role => (
                <th key={role.id} className="text-left py-2 px-2">
                  <span className="text-xs truncate max-w-20 block" title={role.role_name}>
                    {role.role_name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(member => {
              const userRole = roles?.find(r => r.id === member.assigned_role_id);
              return (
                <tr key={member.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-3">{member.user_name || member.user_email}</td>
                  <td className="py-3 px-3 text-xs text-slate-600">
                    <Badge variant="outline" className="text-xs">
                      {member.role_in_department}
                    </Badge>
                  </td>
                  <td className="py-3 px-3">
                    {userRole ? (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {userRole.role_name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-500">Keine Rolle</span>
                    )}
                  </td>
                  {roles?.slice(0, 5).map(role => (
                    <td key={`${member.id}-${role.id}`} className="py-3 px-2 text-center">
                      {member.assigned_role_id === role.id ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <Card className="bg-slate-50">
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-slate-600">Keine Mitglieder gefunden</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}