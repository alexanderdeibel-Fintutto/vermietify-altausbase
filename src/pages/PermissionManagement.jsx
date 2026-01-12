import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, Users, Building2, Search } from 'lucide-react';
import RolePermissionMatrix from '@/components/permissions/RolePermissionMatrix';
import BuildingAccessManager from '@/components/permissions/BuildingAccessManager';
import { Badge } from "@/components/ui/badge";

export default function PermissionManagement() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: mandant } = useQuery({
    queryKey: ['mandant'],
    queryFn: () => base44.entities.Mandant.list().then(r => r[0])
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: userAccessCounts = {} } = useQuery({
    queryKey: ['userAccessCounts'],
    queryFn: async () => {
      const allAccess = await base44.entities.UserMandantAccess.list();
      const counts = {};
      allAccess.forEach(access => {
        counts[access.user_email] = (counts[access.user_email] || 0) + 1;
      });
      return counts;
    }
  });

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Berechtigungsverwaltung</h1>
        <p className="text-slate-600 mt-1">Rollen- und objektbasierte Zugriffskontrolle</p>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList>
          <TabsTrigger value="roles">
            <Shield className="w-4 h-4 mr-2" />
            Rollenberechtigungen
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Benutzerzugriffe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <RolePermissionMatrix mandantId={mandant?.id} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Benutzer verwalten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Benutzer suchen..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2">
                {filteredUsers.map(user => (
                  <Card key={user.id} className="border-slate-200">
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{user.full_name || user.email}</p>
                          <p className="text-xs text-slate-600">{user.email}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {user.role === 'admin' ? 'Admin' : 'Benutzer'}
                            </Badge>
                            {userAccessCounts[user.email] > 0 && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">
                                {userAccessCounts[user.email]} Zugriff{userAccessCounts[user.email] > 1 ? 'e' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {user.role !== 'admin' && (
                        <BuildingAccessManager userEmail={user.email} />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}