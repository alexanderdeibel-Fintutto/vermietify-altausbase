import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SendDocumentDialog({ open, onOpenChange, document }) {
    const [selectedContactId, setSelectedContactId] = useState('');
    const [nachrichtText, setNachrichtText] = useState('');
    const queryClient = useQueryClient();

    const { data: account } = useQuery({
        queryKey: ['whatsapp-account-primary'],
        queryFn: async () => {
            const accounts = await base44.entities.WhatsAppAccount.list();
            return accounts[0];
        }
    });

    const { data: kontakte = [] } = useQuery({
        queryKey: ['whatsapp-contacts-opted-in'],
        queryFn: () => base44.entities.WhatsAppContact.filter({
            opt_in_status: 'erteilt'
        }),
        enabled: !!account
    });

    const sendMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.functions.invoke('whatsapp_sendDocument', {
                whatsapp_contact_id: selectedContactId,
                document_id: document.id,
                nachricht_text: nachrichtText
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
            toast.success('Dokument über WhatsApp versendet');
            onOpenChange(false);
            setSelectedContactId('');
            setNachrichtText('');
        },
        onError: (error) => {
            toast.error(error.message || 'Fehler beim Versand');
        }
    });

    const handleSend = () => {
        if (!selectedContactId) {
            toast.error('Bitte wählen Sie einen Kontakt aus');
            return;
        }
        sendMutation.mutate();
    };

    if (!account) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>WhatsApp nicht eingerichtet</DialogTitle>
                    </DialogHeader>
                    <div className="text-center py-4">
                        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                        <p className="text-slate-600">
                            Richten Sie zuerst einen WhatsApp Business Account ein.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Dokument über WhatsApp senden</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-slate-900">{document?.name}</p>
                        <p className="text-xs text-slate-600 mt-1">
                            {document?.category} • {document?.seitenanzahl || 1} Seite(n)
                        </p>
                    </div>

                    <div>
                        <Label>Empfänger auswählen</Label>
                        <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Kontakt wählen..." />
                            </SelectTrigger>
                            <SelectContent>
                                {kontakte.map(kontakt => (
                                    <SelectItem key={kontakt.id} value={kontakt.id}>
                                        <div className="flex items-center gap-2">
                                            <span>{kontakt.name}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {kontakt.telefonnummer}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500 mt-1">
                            {kontakte.length} Kontakt(e) mit Einwilligung verfügbar
                        </p>
                    </div>

                    <div>
                        <Label>Begleitnachricht (optional)</Label>
                        <Textarea
                            value={nachrichtText}
                            onChange={(e) => setNachrichtText(e.target.value)}
                            placeholder="z.B. Hier ist Ihre Nebenkostenabrechnung für 2025..."
                            rows={4}
                        />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                            <div className="text-xs text-blue-900">
                                <p className="font-medium mb-1">WhatsApp-Versand</p>
                                <p>Das PDF wird automatisch als Dokument-Anhang versendet.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button 
                            onClick={handleSend}
                            disabled={sendMutation.isPending || !selectedContactId}
                        >
                            {sendMutation.isPending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sende...</>
                            ) : (
                                <><Send className="w-4 h-4 mr-2" /> Jetzt senden</>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}