import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from 'lucide-react';

export default function ModuleAccessMatrix() {
  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const allUsers = await base44.asServiceRole.entities.User.list();
      return allUsers;
    }
  });

  const { data: moduleAccess = [] } = useQuery({
    queryKey: ['all-module-access'],
    queryFn: () => base44.asServiceRole.entities.ModuleAccess.list()
  });

  const modules = [
    'property',
    'finance', 
    'documents',
    'tenants',
    'tax_rental',
    'communication',
    'accounts',
    'tasks'
  ];

  const getUserAccess = (userId, moduleCode) => {
    return moduleAccess.some(ma => 
      ma.account_id === userId && 
      ma.module_code === moduleCode && 
      ma.is_active &&
      (!ma.expires_date || new Date(ma.expires_date) > new Date())
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modul-Zugriffsmatrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Benutzer</th>
                {modules.map(mod => (
                  <th key={mod} className="text-center p-2 font-medium">
                    <div className="text-xs">{mod}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b hover:bg-slate-50">
                  <td className="p-2">
                    <div className="font-medium">{user.full_name || user.email}</div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {user.role}
                    </Badge>
                  </td>
                  {modules.map(mod => {
                    const hasAccess = getUserAccess(user.id, mod);
                    return (
                      <td key={mod} className="text-center p-2">
                        {hasAccess ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-300 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}