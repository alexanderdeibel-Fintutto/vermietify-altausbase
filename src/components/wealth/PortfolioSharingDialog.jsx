import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Share2, Eye, MessageSquare, Edit3, Copy, Link } from 'lucide-react';
import { toast } from 'sonner';

export default function PortfolioSharingDialog({ open, onOpenChange, portfolioId, userId }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [shareType, setShareType] = useState('user');
  const [expiresAt, setExpiresAt] = useState('');

  const { data: shares = [] } = useQuery({
    queryKey: ['portfolioShares', portfolioId],
    queryFn: async () => {
      return await base44.entities.PortfolioShare.filter({ portfolio_id: portfolioId }, '-shared_at', 50) || [];
    }
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      const share = await base44.functions.invoke('createPortfolioShare', {
        portfolioId,
        sharedByUserId: userId,
        sharedWithEmail: email,
        permissionLevel: permission,
        shareType,
        expiresAt: expiresAt || null
      });
      return share;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolioShares'] });
      setEmail('');
      setPermission('view');
      setShareType('user');
      setExpiresAt('');
      toast.success('Portfolio geteilt!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (shareId) => base44.entities.PortfolioShare.delete(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolioShares'] });
      toast.success('Freigabe entfernt');
    }
  });

  const copyShareLink = (share) => {
    const link = `${window.location.origin}/wealth/shared/${share.share_token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link kopiert!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Portfolio teilen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Neue Freigabe hinzufügen */}
          <div className="border rounded-lg p-4 space-y-4 bg-slate-50">
            <h3 className="font-semibold">Neue Freigabe</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email-Adresse</Label>
                <Input
                  type="email"
                  placeholder="berater@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Art der Freigabe</Label>
                <Select value={shareType} onValueChange={setShareType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Benutzer</SelectItem>
                    <SelectItem value="advisor">Steuerberater</SelectItem>
                    <SelectItem value="family">Familienmitglied</SelectItem>
                    <SelectItem value="public">Öffentlich (Link)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <SelectItem value="comment">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Kommentare
                      </div>
                    </SelectItem>
                    <SelectItem value="edit">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4" /> Bearbeiten
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Verfallsdatum (optional)</Label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <Button onClick={() => shareMutation.mutate()} disabled={!email || shareMutation.isPending} className="w-full">
              {shareMutation.isPending ? 'Wird geteilt...' : 'Freigeben'}
            </Button>
          </div>

          {/* Aktive Freigaben */}
          <div>
            <h3 className="font-semibold mb-3">Aktive Freigaben ({shares.length})</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {shares.filter(s => s.is_active).map(share => (
                <div key={share.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{share.shared_with_email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {share.permission_level === 'view' && <Eye className="w-3 h-3 mr-1" />}
                        {share.permission_level === 'comment' && <MessageSquare className="w-3 h-3 mr-1" />}
                        {share.permission_level === 'edit' && <Edit3 className="w-3 h-3 mr-1" />}
                        {share.permission_level}
                      </Badge>
                      {share.share_type === 'advisor' && (
                        <Badge className="text-xs bg-blue-100 text-blue-800">Berater</Badge>
                      )}
                      {share.expires_at && (
                        <span className="text-xs text-slate-500">
                          Verfällt: {new Date(share.expires_at).toLocaleDateString('de-DE')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {share.share_token && (
                      <Button size="sm" variant="ghost" onClick={() => copyShareLink(share)}>
                        <Link className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(share.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}