import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Plus, Trash2, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentPermissionManager({ documentId }) {
  const [userEmail, setUserEmail] = useState('');
  const [permissionLevel, setPermissionLevel] = useState('view');
  const [canShare, setCanShare] = useState(false);
  const queryClient = useQueryClient();

  const { data: permissions = [] } = useQuery({
    queryKey: ['document-permissions', documentId],
    queryFn: () => base44.entities.DocumentPermission?.filter?.({
      document_id: documentId
    }) || []
  });

  const addPermissionMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.DocumentPermission.create({
        document_id: documentId,
        user_email: userEmail,
        permission_level: permissionLevel,
        can_share: canShare
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-permissions', documentId] });
      setUserEmail('');
      setPermissionLevel('view');
      setCanShare(false);
      toast.success('Berechtigung hinzugefügt');
    }
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async (permId, newLevel) => {
      return await base44.entities.DocumentPermission.update(permId, {
        permission_level: newLevel
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-permissions', documentId] });
    }
  });

  const removePermissionMutation = useMutation({
    mutationFn: async (permId) => {
      return await base44.entities.DocumentPermission.delete(permId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-permissions', documentId] });
      toast.success('Berechtigung entfernt');
    }
  });

  const permissionLabels = {
    view: 'Anschauen',
    comment: 'Kommentieren',
    edit: 'Bearbeiten',
    admin: 'Admin'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="w-4 h-4" />
          Berechtigungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Permission */}
        <div className="space-y-2 p-3 border rounded-lg bg-slate-50">
          <div className="flex gap-2">
            <Input
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="Benutzer-Email"
              className="flex-1 text-sm"
            />
            <Select value={permissionLevel} onValueChange={setPermissionLevel}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(permissionLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 flex-1 text-sm">
              <input
                type="checkbox"
                checked={canShare}
                onChange={(e) => setCanShare(e.target.checked)}
                className="rounded"
              />
              <span>Teilen erlauben</span>
            </label>
            <Button
              onClick={() => addPermissionMutation.mutate()}
              disabled={!userEmail.trim() || addPermissionMutation.isPending}
              className="gap-1"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Hinzufügen
            </Button>
          </div>
        </div>

        {/* Permissions List */}
        <div className="space-y-2">
          {permissions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Noch keine Berechtigungen</p>
          ) : (
            permissions.map(perm => (
              <div key={perm.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{perm.user_email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {permissionLabels[perm.permission_level]}
                    </Badge>
                    {perm.can_share && (
                      <Badge variant="outline" className="text-xs bg-green-50">
                        Kann teilen
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 h-7 w-7 p-0"
                  onClick={() => removePermissionMutation.mutate(perm.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}