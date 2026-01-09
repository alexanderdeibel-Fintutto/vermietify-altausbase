import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function RoleAssignmentManager() {
  const [selectedMember, setSelectedMember] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const { data: deptMembers, isLoading: loadingMembers, refetch } = useQuery({
    queryKey: ['departmentMembers'],
    queryFn: async () => {
      try {
        return await base44.entities.DepartmentMember.list('-joined_at', 100);
      } catch {
        return [];
      }
    }
  });

  const { data: roles, isLoading: loadingRoles } = useQuery({
    queryKey: ['rolesForAssignment'],
    queryFn: async () => {
      try {
        return await base44.entities.UserRole.list('-created_at', 50);
      } catch {
        return [];
      }
    }
  });

  const handleAssignRole = async () => {
    if (!selectedMember || !selectedRole) {
      toast.error('Bitte Mitglied und Rolle wählen');
      return;
    }

    try {
      await base44.functions.invoke('manageRolePermissions', {
        action: 'assign_role_to_member',
        department_member_id: selectedMember.id,
        role_id: selectedRole
      });
      toast.success('Rolle zugewiesen');
      setShowRoleDialog(false);
      refetch();
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rolle zuweisen: {selectedMember?.user_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {loadingRoles ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : roles && roles.length > 0 ? (
              roles.map(role => (
                <Card
                  key={role.id}
                  className={`cursor-pointer ${selectedRole === role.id ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardContent className="pt-3">
                    <p className="font-semibold text-sm">{role.role_name}</p>
                    <p className="text-xs text-slate-600 mt-1">{role.description}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-slate-600">Keine Rollen verfügbar</p>
            )}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAssignRole}
                className="flex-1 bg-blue-600"
                disabled={!selectedRole}
              >
                Zuweisen
              </Button>
              <Button
                onClick={() => setShowRoleDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Abteilungsmitglieder</h3>
          {loadingMembers ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : deptMembers && deptMembers.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {deptMembers.map(member => (
                <Card
                  key={member.id}
                  className={`cursor-pointer transition-all ${
                    selectedMember?.id === member.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedMember(member)}
                >
                  <CardContent className="pt-3">
                    <p className="font-semibold text-sm">{member.user_name || member.user_email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {member.role_in_department}
                      </Badge>
                      {member.assigned_role_name && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          {member.assigned_role_name}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">Keine Mitglieder vorhanden</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Rollenzuweisung</h3>
            {selectedMember && (
              <Button
                size="sm"
                onClick={() => setShowRoleDialog(true)}
                className="bg-blue-600"
              >
                Rolle zuweisen
              </Button>
            )}
          </div>
          {selectedMember ? (
            <Card className="bg-slate-50">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-600">Mitglied</p>
                    <p className="font-semibold">{selectedMember.user_name || selectedMember.user_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Rolle in Abteilung</p>
                    <Badge className="mt-1 capitalize">{selectedMember.role_in_department}</Badge>
                  </div>
                  {selectedMember.assigned_role_name ? (
                    <div>
                      <p className="text-xs text-slate-600">Zugewiesene Systemrolle</p>
                      <Badge className="mt-1 bg-blue-100 text-blue-800">
                        {selectedMember.assigned_role_name}
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Keine Systemrolle zugewiesen</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-50">
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-slate-600">Wählen Sie ein Mitglied aus</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}