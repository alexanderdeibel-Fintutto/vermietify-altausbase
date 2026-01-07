import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

export default function InviteUserDialog({ open, onOpenChange }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [assignedRole, setAssignedRole] = useState('');
  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ['all-roles'],
    queryFn: () => base44.asServiceRole.entities.Role.list()
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      await base44.users.inviteUser(email, role);
      return { email, role };
    },
    onSuccess: async ({ email }) => {
      // User wurde eingeladen, jetzt Rolle zuweisen falls gewählt
      if (assignedRole) {
        // Warte kurz, dann hole neuen User und weise Rolle zu
        setTimeout(async () => {
          const users = await base44.asServiceRole.entities.User.filter({ email });
          if (users.length > 0) {
            await base44.functions.invoke('assignRoleToUser', {
              userId: users[0].id,
              roleId: assignedRole,
              validFrom: new Date().toISOString().split('T')[0]
            });
          }
        }, 1000);
      }
      
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('Benutzer eingeladen');
      setEmail('');
      setRole('user');
      setAssignedRole('');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Fehler beim Einladen');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    inviteMutation.mutate({ email, role });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Benutzer einladen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="benutzer@beispiel.de"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="base-role">Base44 Rolle</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="assigned-role">System-Rolle (optional)</Label>
            <Select value={assignedRole} onValueChange={setAssignedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Keine Rolle zuweisen" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} ({r.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              <UserPlus className="w-4 h-4 mr-2" />
              Einladen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}