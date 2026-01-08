import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Eye, EyeOff, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function TestAccountManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [formData, setFormData] = useState({
    account_name: '',
    test_email: '',
    test_password: '',
    simulated_role: 'user',
    package_level: 'basic',
    description: ''
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: testAccounts = [] } = useQuery({
    queryKey: ['test-accounts'],
    queryFn: () => base44.entities.TestAccount.filter({ tester_id: user?.id })
  });

  const createAccountMutation = useMutation({
    mutationFn: (data) => base44.entities.TestAccount.create({
      ...data,
      tester_id: user.id,
      is_active: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-accounts'] });
      toast.success('Test-Account erstellt! 🎯');
      setShowDialog(false);
      setFormData({
        account_name: '',
        test_email: '',
        test_password: '',
        simulated_role: 'user',
        package_level: 'basic',
        description: ''
      });
    }
  });

  const togglePasswordVisibility = (accountId) => {
    setShowPassword(prev => ({ ...prev, [accountId]: !prev[accountId] }));
  };

  const copyCredentials = (account) => {
    const text = `Email: ${account.test_email}\nPassword: ${account.test_password}`;
    navigator.clipboard.writeText(text);
    toast.success('Zugangsdaten kopiert! 📋');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Test-Accounts</h2>
          <p className="text-sm text-slate-600">Verwalte verschiedene Test-Accounts für unterschiedliche Szenarien</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <UserCog className="w-4 h-4" />
          Neuer Test-Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testAccounts.map((account, idx) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className={!account.is_active ? 'opacity-50' : ''}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{account.account_name}</span>
                  <Badge className={account.is_active ? 'bg-green-600' : 'bg-slate-500'}>
                    {account.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Email:</span>
                  <span className="font-mono">{account.test_email}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">
                      {showPassword[account.id] ? account.test_password : '••••••••'}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => togglePasswordVisibility(account.id)}
                    >
                      {showPassword[account.id] ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{account.simulated_role}</Badge>
                  <Badge variant="outline">{account.package_level}</Badge>
                </div>
                {account.description && (
                  <p className="text-xs text-slate-600 mt-2">{account.description}</p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => copyCredentials(account)}
                >
                  <Copy className="w-3 h-3" />
                  Zugangsdaten kopieren
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Test-Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Account-Name *</Label>
              <Input
                value={formData.account_name}
                onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
                placeholder="z.B. Admin Test, Basic User"
              />
            </div>

            <div>
              <Label>Test-Email *</Label>
              <Input
                type="email"
                value={formData.test_email}
                onChange={(e) => setFormData(prev => ({ ...prev, test_email: e.target.value }))}
                placeholder="test.user@example.com"
              />
            </div>

            <div>
              <Label>Test-Password *</Label>
              <Input
                type="password"
                value={formData.test_password}
                onChange={(e) => setFormData(prev => ({ ...prev, test_password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>

            <div>
              <Label>Simulierte Rolle</Label>
              <Select 
                value={formData.simulated_role} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, simulated_role: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">👑 Admin</SelectItem>
                  <SelectItem value="user">👤 User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Paket-Level</Label>
              <Select 
                value={formData.package_level} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, package_level: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">📦 Basic</SelectItem>
                  <SelectItem value="professional">⚡ Professional</SelectItem>
                  <SelectItem value="enterprise">🚀 Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Beschreibung (optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Wofür wird dieser Account verwendet?"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => createAccountMutation.mutate(formData)}
                disabled={!formData.account_name || !formData.test_email || !formData.test_password || createAccountMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Account erstellen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}