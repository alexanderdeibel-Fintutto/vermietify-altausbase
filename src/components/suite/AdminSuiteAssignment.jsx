import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Package, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSuiteAssignment() {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedSuite, setSelectedSuite] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const { data: suites = [] } = useQuery({
    queryKey: ['app-suites'],
    queryFn: () => base44.asServiceRole.entities.AppSuite.filter({ active: true })
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['suite-subscriptions'],
    queryFn: () => base44.asServiceRole.entities.UserSuiteSubscription.list()
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('activateSuiteForUser', {
        userId: selectedUser,
        suiteId: selectedSuite
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suite-subscriptions'] });
      toast.success('Suite erfolgreich zugewiesen');
      setSelectedUser('');
      setSelectedSuite('');
    }
  });

  const getUserSubscriptions = (userId) => {
    return subscriptions
      .filter(sub => sub.user_id === userId && sub.status === 'active')
      .map(sub => suites.find(s => s.id === sub.suite_id))
      .filter(s => s);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Suite-Zuweisung (Admin)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-slate-50 border rounded-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Benutzer</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Benutzer wählen" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Suite</label>
              <Select value={selectedSuite} onValueChange={setSelectedSuite}>
                <SelectTrigger>
                  <SelectValue placeholder="Suite wählen" />
                </SelectTrigger>
                <SelectContent>
                  {suites.map(suite => (
                    <SelectItem key={suite.id} value={suite.id}>
                      {suite.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={() => assignMutation.mutate()}
            disabled={!selectedUser || !selectedSuite || assignMutation.isPending}
            className="w-full"
          >
            {assignMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Zuweisen...</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" /> Suite zuweisen</>
            )}
          </Button>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Aktive Zuweisungen ({subscriptions.filter(s => s.status === 'active').length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.slice(0, 10).map(user => {
              const userSubs = getUserSubscriptions(user.id);
              if (userSubs.length === 0) return null;
              
              return (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {user.full_name?.charAt(0) || user.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{user.full_name || user.email}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {userSubs.map(suite => (
                      <Badge key={suite.id} variant="secondary">
                        {suite.display_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-slate-600 bg-blue-50 p-3 rounded-lg">
          <strong>Admin-Tool:</strong> Ermöglicht direkte Suite-Zuweisung an Benutzer ohne Kaufprozess.
        </div>
      </CardContent>
    </Card>
  );
}