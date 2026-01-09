import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Pen, Plus, X, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function SignatureWorkflow({ documentId, onClose }) {
  const [signers, setSigners] = useState([]);
  const [newSignerEmail, setNewSignerEmail] = useState('');
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [currentSignature, setCurrentSignature] = useState(null);
  const queryClient = useQueryClient();

  const { data: document } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => base44.entities.Document.filter({ id: documentId }, null, 1).then(d => d[0])
  });

  const { data: signatures = [] } = useQuery({
    queryKey: ['signatures', documentId],
    queryFn: () => base44.entities.DocumentSignature.filter({ document_id: documentId }, 'signature_order', 50)
  });

  const addSignerMutation = useMutation({
    mutationFn: async (email) => {
      const user = await base44.auth.me();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      return await base44.entities.DocumentSignature.create({
        document_id: documentId,
        signer_email: email,
        signer_name: email.split('@')[0],
        status: 'pending',
        signature_order: signatures.length + 1,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signatures', documentId] });
      toast.success('Unterzeichner hinzugefügt');
      setNewSignerEmail('');
    }
  });

  const sendSignatureRequestMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      for (const signature of signatures.filter(s => s.status === 'pending')) {
        await base44.integrations.Core.SendEmail({
          to: signature.signer_email,
          subject: `Signaturanfrage: ${document.title}`,
          body: `Hallo ${signature.signer_name},

Sie wurden gebeten, das folgende Dokument zu signieren: "${document.title}"

Bitte melden Sie sich im Portal an, um das Dokument zu überprüfen und zu signieren.

Ablaufdatum: ${new Date(signature.expires_at).toLocaleDateString('de-DE')}

Mit freundlichen Grüßen,
${user.full_name}`
        });

        await base44.entities.DocumentSignature.update(signature.id, {
          reminder_sent: true
        });
      }
    },
    onSuccess: () => {
      toast.success('Signaturanfragen versendet');
      queryClient.invalidateQueries({ queryKey: ['signatures', documentId] });
    }
  });

  const signDocumentMutation = useMutation({
    mutationFn: async ({ signatureId, signatureData }) => {
      return await base44.entities.DocumentSignature.update(signatureId, {
        status: 'signed',
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
        ip_address: 'masked'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signatures', documentId] });
      toast.success('Dokument signiert');
      setShowSignDialog(false);
    }
  });

  const addSigner = () => {
    if (!newSignerEmail || !newSignerEmail.includes('@')) {
      toast.error('Bitte gültige E-Mail eingeben');
      return;
    }
    addSignerMutation.mutate(newSignerEmail);
  };

  const removeSigner = async (signatureId) => {
    await base44.entities.DocumentSignature.delete(signatureId);
    queryClient.invalidateQueries({ queryKey: ['signatures', documentId] });
    toast.success('Unterzeichner entfernt');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'signed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-600" />;
      case 'declined': return <X className="w-4 h-4 text-red-600" />;
      case 'expired': return <AlertCircle className="w-4 h-4 text-slate-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'signed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pen className="w-5 h-5" />
            Signatur-Workflow: {document?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Signer */}
          <div className="flex gap-2">
            <Input
              placeholder="E-Mail des Unterzeichners"
              value={newSignerEmail}
              onChange={(e) => setNewSignerEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSigner()}
            />
            <Button onClick={addSigner} disabled={addSignerMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              Hinzufügen
            </Button>
          </div>

          {/* Signers List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Unterzeichner ({signatures.length})</h3>
              {signatures.some(s => s.status === 'pending') && (
                <Button
                  size="sm"
                  onClick={() => sendSignatureRequestMutation.mutate()}
                  disabled={sendSignatureRequestMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Anfragen versenden
                </Button>
              )}
            </div>

            {signatures.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-slate-600">
                  Noch keine Unterzeichner hinzugefügt
                </CardContent>
              </Card>
            ) : (
              signatures.map((signature, idx) => (
                <Card key={signature.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">#{signature.signature_order}</Badge>
                          <p className="font-medium">{signature.signer_email}</p>
                          {getStatusIcon(signature.status)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <Badge className={getStatusColor(signature.status)}>
                            {signature.status === 'signed' ? 'Signiert' :
                             signature.status === 'pending' ? 'Ausstehend' :
                             signature.status === 'declined' ? 'Abgelehnt' : 'Abgelaufen'}
                          </Badge>
                          {signature.signed_at && (
                            <span>Signiert: {new Date(signature.signed_at).toLocaleString('de-DE')}</span>
                          )}
                          {signature.status === 'pending' && (
                            <span>Läuft ab: {new Date(signature.expires_at).toLocaleDateString('de-DE')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {signature.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setCurrentSignature(signature);
                              setShowSignDialog(true);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Pen className="w-4 h-4 mr-1" />
                            Signieren
                          </Button>
                        )}
                        {signature.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeSigner(signature.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {showSignDialog && currentSignature && (
          <SignatureDialog
            signature={currentSignature}
            document={document}
            onClose={() => setShowSignDialog(false)}
            onSign={(signatureData) => signDocumentMutation.mutate({ 
              signatureId: currentSignature.id, 
              signatureData 
            })}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SignatureDialog({ signature, document, onClose, onSign }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL();
    onSign(signatureData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dokument signieren</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded border">
            <p className="text-sm font-medium mb-1">Dokument: {document.title}</p>
            <p className="text-xs text-slate-600">Als: {signature.signer_email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ihre Unterschrift</label>
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              className="border border-slate-300 rounded cursor-crosshair w-full"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            <Button variant="outline" size="sm" onClick={clearSignature} className="mt-2">
              Löschen
            </Button>
          </div>

          <div className="text-xs text-slate-500 p-3 bg-amber-50 border border-amber-200 rounded">
            Mit Ihrer Unterschrift bestätigen Sie, dass Sie das Dokument gelesen und verstanden haben.
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button onClick={saveSignature} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Signieren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}