import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Share2, Eye, Edit } from 'lucide-react';

export default function PortfolioSharingDialog({ open, onOpenChange, portfolioId }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');

  const { data: shares = [] } = useQuery({
    queryKey: ['portfolioShares', portfolioId],
    queryFn: async () => {
      const result = await base44.entities.PortfolioShare.filter({ portfolio_id: portfolioId }) || [];
      return result;
    }
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.PortfolioShare.create({
        portfolio_id: portfolioId,
        shared_with_email: email,
        permission_level: permission,
        shared_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolioShares'] });
      setEmail('');
      setPermission('view');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (shareId) => base44.entities.PortfolioShare.delete(shareId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolioShares'] })
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Portfolio teilen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Email-Adresse</Label>
            <Input 
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Berechtigung</Label>
            <Select value={permission} onValueChange={setPermission}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Nur ansehen
                  </div>
                </SelectItem>
                <SelectItem value="comment">Kommentare</SelectItem>
                <SelectItem value="edit">
                  <div className="flex items-center gap-2">
                    <Edit className="w-4 h-4" /> Bearbeiten
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={() => shareMutation.mutate()}
            disabled={!email || shareMutation.isPending}
            className="w-full"
          >
            {shareMutation.isPending ? 'Wird geteilt...' : 'Freigeben'}
          </Button>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {shares.map(share => (
              <div key={share.id} className="flex items-center justify-between p-3 bg-slate-50 rounded text-sm">
                <div>
                  <div className="font-medium">{share.shared_with_email}</div>
                  <div className="text-xs text-slate-500 capitalize">{share.permission_level}</div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(share.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}