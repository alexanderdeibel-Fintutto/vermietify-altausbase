import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function DepartmentManager() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptForm, setDeptForm] = useState({
    department_name: '',
    department_code: '',
    description: '',
    manager_email: ''
  });
  const [memberForm, setMemberForm] = useState({
    user_email: '',
    role_in_department: 'member'
  });

  const { data: deptData, isLoading, refetch } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('manageDepartment', {
          action: 'list_depts'
        });
        return response.data;
      } catch {
        return { departments: [], members: [] };
      }
    }
  });

  const handleCreateDept = async () => {
    try {
      await base44.functions.invoke('manageDepartment', {
        action: 'create_dept',
        ...deptForm
      });
      toast.success('Abteilung erstellt');
      setDeptForm({ department_name: '', department_code: '', description: '', manager_email: '' });
      setShowCreateDialog(false);
      refetch();
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    }
  };

  const handleAddMember = async () => {
    if (!selectedDept || !memberForm.user_email) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }
    try {
      await base44.functions.invoke('manageDepartment', {
        action: 'add_member',
        department_id: selectedDept.id,
        ...memberForm
      });
      toast.success('Mitglied hinzugefügt');
      setMemberForm({ user_email: '', role_in_department: 'member' });
      setShowAddMemberDialog(false);
      refetch();
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    }
  };

  const deptMembers = deptData?.members?.filter(m => m.department_id === selectedDept?.id) || [];

  return (
    <div className="space-y-4">
      <Tabs defaultValue="depts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="depts">Abteilungen</TabsTrigger>
          <TabsTrigger value="members" disabled={!selectedDept}>Mitglieder</TabsTrigger>
        </TabsList>

        <TabsContent value="depts" className="space-y-4">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neue Abteilung</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Name</Label>
                  <Input
                    value={deptForm.department_name}
                    onChange={(e) => setDeptForm({...deptForm, department_name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Code</Label>
                  <Input
                    value={deptForm.department_code}
                    onChange={(e) => setDeptForm({...deptForm, department_code: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Abteilungsleiter-Email</Label>
                  <Input
                    type="email"
                    value={deptForm.manager_email}
                    onChange={(e) => setDeptForm({...deptForm, manager_email: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateDept} className="flex-1 bg-blue-600">
                    Erstellen
                  </Button>
                  <Button onClick={() => setShowCreateDialog(false)} variant="outline" className="flex-1">
                    Abbrechen
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex justify-end mb-4">
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Neue Abteilung
            </Button>
          </div>

          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : deptData?.departments && deptData.departments.length > 0 ? (
            <div className="space-y-2">
              {deptData.departments.map(dept => (
                <Card
                  key={dept.id}
                  className="cursor-pointer hover:border-slate-400"
                  onClick={() => setSelectedDept(dept)}
                >
                  <CardContent className="pt-4">
                    <p className="font-semibold">{dept.department_name}</p>
                    <p className="text-xs text-slate-600 mt-1">{dept.department_code}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <Users className="w-3 h-3" />
                      <span>{dept.member_count || 0} Mitglieder</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">Keine Abteilungen vorhanden</p>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          {selectedDept && (
            <>
              <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Mitglied hinzufügen</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm">Email</Label>
                      <Input
                        type="email"
                        value={memberForm.user_email}
                        onChange={(e) => setMemberForm({...memberForm, user_email: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Rolle</Label>
                      <select
                        value={memberForm.role_in_department}
                        onChange={(e) => setMemberForm({...memberForm, role_in_department: e.target.value})}
                        className="w-full mt-1 border border-slate-200 rounded px-3 py-2 text-sm"
                      >
                        <option value="member">Mitglied</option>
                        <option value="lead">Team-Lead</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddMember} className="flex-1 bg-blue-600">
                        Hinzufügen
                      </Button>
                      <Button onClick={() => setShowAddMemberDialog(false)} variant="outline" className="flex-1">
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="flex justify-between items-center mb-4">
                <p className="font-semibold text-sm">{selectedDept.department_name} - Mitglieder ({deptMembers.length})</p>
                <Button
                  onClick={() => setShowAddMemberDialog(true)}
                  size="sm"
                  className="bg-blue-600"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Mitglied
                </Button>
              </div>

              <div className="space-y-2">
                {deptMembers.map(member => (
                  <Card key={member.id}>
                    <CardContent className="pt-3">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-semibold">{member.user_name || member.user_email}</p>
                          <p className="text-xs text-slate-600">{member.role_in_department}</p>
                        </div>
                        <p className="text-xs text-slate-600">
                          {new Date(member.joined_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}