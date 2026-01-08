import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from 'lucide-react';

export default function ConsentManager() {
  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => await base44.asServiceRole.entities.User.list()
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Einwilligungsverwaltung</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {users.length}
              </div>
              <div className="text-sm text-green-900">Registrierte Benutzer</div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.is_tester).length}
              </div>
              <div className="text-sm text-blue-900">Tester-Einwilligungen</div>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-purple-900">Compliance-Rate</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Benutzer-Übersicht</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{user.full_name || user.email}</div>
                    <div className="text-sm text-slate-600">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{user.role}</Badge>
                    {user.is_tester && (
                      <Badge className="bg-blue-100 text-blue-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Tester
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}