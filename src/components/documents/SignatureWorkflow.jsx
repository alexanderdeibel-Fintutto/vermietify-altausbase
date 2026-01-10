import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Send, AlertCircle } from 'lucide-react';

export default function SignatureWorkflow({ isOpen, onClose, documentId, documentName, companyId }) {
  const [signers, setSigners] = useState([]);
  const [newSigner, setNewSigner] = useState({ email: '', name: '', role: '' });
  const [message, setMessage] = useState('');
  const [signingOrder, setSigningOrder] = useState('parallel');
  const queryClient = useQueryClient();

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      if (signers.length === 0) {
        throw new Error('Mindestens ein Unterzeichner erforderlich');
      }

      const request = await base44.entities.SignatureRequest.create({
        document_id: documentId,
        document_name: documentName,
        company_id: companyId,
        initiator_email: (await base44.auth.me()).email,
        initiator_name: (await base44.auth.me()).full_name,
        signers: signers.map(s => ({
          ...s,
          status: 'pending'
        })),
        message,
        signing_order: signingOrder,
        status: 'draft',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        audit_trail: [{
          action: 'created',
          actor: (await base44.auth.me()).email,
          timestamp: new Date().toISOString(),
          details: `Signaturanfrage erstellt für ${signers.length} Unterzeichner`
        }]
      });

      // Send signature requests
      await base44.functions.invoke('sendSignatureRequests', {
        signature_request_id: request.id,
        signers,
        document_url: (await base44.entities.Document.filter({ id: documentId }))[0]?.url,
        message
      });

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signature-requests'] });
      onClose();
      setSigners([]);
      setMessage('');
    }
  });

  const addSigner = () => {
    if (!newSigner.email) return;
    setSigners([...signers, { ...newSigner, id: Math.random().toString(36) }]);
    setNewSigner({ email: '', name: '', role: '' });
  };

  const removeSigner = (id) => {
    setSigners(signers.filter(s => s.id !== id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Signaturanfrage erstellen</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Info */}
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-sm text-slate-600">Dokument</p>
            <p className="text-sm font-medium text-slate-900">{documentName}</p>
          </div>

          {/* Signers */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-900">Unterzeichner hinzufügen</h3>
            
            <div className="space-y-2">
              <Input
                placeholder="Email-Adresse"
                value={newSigner.email}
                onChange={(e) => setNewSigner({ ...newSigner, email: e.target.value })}
                type="email"
              />
              <Input
                placeholder="Name"
                value={newSigner.name}
                onChange={(e) => setNewSigner({ ...newSigner, name: e.target.value })}
              />
              <Input
                placeholder="Rolle (z.B. Geschäftsführer)"
                value={newSigner.role}
                onChange={(e) => setNewSigner({ ...newSigner, role: e.target.value })}
              />
              <Button
                onClick={addSigner}
                className="w-full gap-2"
                variant="outline"
              >
                <Plus className="w-4 h-4" />
                Unterzeichner hinzufügen
              </Button>
            </div>

            {signers.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-slate-600">{signers.length} Unterzeichner</p>
                {signers.map(signer => (
                  <div key={signer.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="text-sm">
                      <p className="font-medium text-slate-900">{signer.name}</p>
                      <p className="text-slate-600">{signer.email}</p>
                      {signer.role && <Badge variant="outline" className="mt-1">{signer.role}</Badge>}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeSigner(signer.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Signing Order */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Signaturreihenfolge</label>
            <div className="flex gap-2">
              {['parallel', 'sequential'].map(order => (
                <Button
                  key={order}
                  variant={signingOrder === order ? 'default' : 'outline'}
                  onClick={() => setSigningOrder(order)}
                  className="flex-1"
                >
                  {order === 'parallel' ? 'Parallel' : 'Nacheinander'}
                </Button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Nachricht</label>
            <Textarea
              placeholder="Persönliche Nachricht an Unterzeichner (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900">
              <p className="font-semibold">Automatische Ablauf in 30 Tagen</p>
              <p>Unterzeichner erhalten E-Mails mit Signaturlinks</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button
              onClick={() => createRequestMutation.mutate()}
              disabled={signers.length === 0 || createRequestMutation.isPending}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Signaturanfrage senden
            </Button>
          </div>

          {createRequestMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-900">{createRequestMutation.error.message}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}