import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Share2, Trash2 } from 'lucide-react';

export default function DocumentSharingMatrix({ documentId }) {
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('view');
  const queryClient = useQueryClient();

  const { data: permissions = [] } = useQuery({
    queryKey: ['document-permissions', documentId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.DocumentPermission.filter({
        document_id: documentId
      });
      return result;
    }
  });

  const shareMutation = useMutation({
    mutationFn: () =>
      base44.asServiceRole.entities.DocumentPermission.create({
        document_id: documentId,
        user_email: shareEmail,
        permission: sharePermission
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-permissions'] });
      setShareEmail('');
      setSharePermission('view');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.DocumentPermission.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['document-permissions'] })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          Berechtigungsmatrix
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add Share */}
        <div className="flex gap-2">
          <Input
            placeholder="E-Mail"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            className="flex-1 text-sm"
          />
          <Select value={sharePermission} onValueChange={setSharePermission}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="view">Ansicht</SelectItem>
              <SelectItem value="edit">Bearbeiten</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => shareMutation.mutate()}
            disabled={!shareEmail || shareMutation.isPending}
          >
            Teilen
          </Button>
        </div>

        {/* Permissions List */}
        <div className="space-y-2">
          {permissions.map(perm => (
            <div
              key={perm.id}
              className="flex items-center justify-between p-2 bg-slate-50 rounded"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{perm.user_email}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {perm.permission}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteMutation.mutate(perm.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}