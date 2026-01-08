import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Key, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function TestAccountManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    account_name: '',
    test_email: '',
    test_password: '',
    simulated_role: 'user',
    package_level: 'basic',
    description: '',
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ['test-accounts'],
    queryFn: () => base44.asServiceRole.entities.TestAccount.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.asServiceRole.entities.TestAccount.create({
        ...data,
        tester_id: user.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-accounts'] });
      toast.success('Test-Account erstellt!');
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.asServiceRole.entities.TestAccount.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-accounts'] });
      toast.success('Test-Account aktualisiert!');
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.TestAccount.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-accounts'] });
      toast.success('Test-Account gelöscht');
    }
  });

  const resetForm = () => {
    setFormData({
      account_name: '',
      test_email: '',
      test_password: '',
      simulated_role: 'user',
      package_level: 'basic',
      description: '',
      is_active: true
    });
    setEditingAccount(null);
    setDialogOpen(false);
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      account_name: account.account_name,
      test_email: account.test_email,
      test_password: account.test_password || '',
      simulated_role: account.simulated_role,
      package_level: account.package_level,
      description: account.description || '',
      is_active: account.is_active
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Test-Accounts</h3>
          <p className="text-sm text-slate-600">Verwaltung von Test-Zugängen für verschiedene Szenarien</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Test-Account erstellen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAccount ? 'Test-Account bearbeiten' : 'Neuer Test-Account'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Account-Name *</Label>
                  <Input
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    placeholder="Admin-Test"
                  />
                </div>
                <div>
                  <Label>E-Mail *</Label>
                  <Input
                    type="email"
                    value={formData.test_email}
                    onChange={(e) => setFormData({ ...formData, test_email: e.target.value })}
                    placeholder="test@example.com"
                  />
                </div>
              </div>
              <div>
                <Label>Passwort *</Label>
                <Input
                  type="password"
                  value={formData.test_password}
                  onChange={(e) => setFormData({ ...formData, test_password: e.target.value })}
                  placeholder="Sicheres Passwort"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Simulierte Rolle</Label>
                  <Select value={formData.simulated_role} onValueChange={(value) => setFormData({ ...formData, simulated_role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="user">Standard-Benutzer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Paket-Level</Label>
                  <Select value={formData.package_level} onValueChange={(value) => setFormData({ ...formData, package_level: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Zweck dieses Test-Accounts..."
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Account ist aktiv</Label>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!formData.account_name || !formData.test_email || !formData.test_password}
                className="w-full"
              >
                {editingAccount ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {accounts.map(account => {
          const tester = users.find(u => u.id === account.tester_id);

          return (
            <Card key={account.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Key className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{account.account_name}</div>
                        <Badge variant="outline">{account.simulated_role}</Badge>
                        <Badge variant="outline">{account.package_level}</Badge>
                        {!account.is_active && <Badge variant="destructive">Inaktiv</Badge>}
                      </div>
                      <div className="text-sm text-slate-600">{account.test_email}</div>
                      {account.description && (
                        <div className="text-sm text-slate-500 mt-1">{account.description}</div>
                      )}
                      {account.last_used && (
                        <div className="text-xs text-slate-500 mt-1">
                          Zuletzt verwendet: {format(new Date(account.last_used), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(account)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Test-Account wirklich löschen?')) {
                          deleteMutation.mutate(account.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}