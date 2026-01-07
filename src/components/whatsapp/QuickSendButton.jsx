import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Send, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickSendButton({ tenantId, size = "sm", variant = "outline" }) {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const queryClient = useQueryClient();

    const { data: whatsappAccount } = useQuery({
        queryKey: ['whatsapp-account'],
        queryFn: async () => {
            const accounts = await base44.entities.WhatsAppAccount.list();
            return accounts[0];
        }
    });

    const { data: contact } = useQuery({
        queryKey: ['whatsapp-contact-for-tenant', tenantId],
        queryFn: async () => {
            if (!tenantId || !whatsappAccount) return null;
            const contacts = await base44.entities.WhatsAppContact.filter({ tenant_id: tenantId });
            return contacts[0];
        },
        enabled: !!tenantId && !!whatsappAccount
    });

    const sendMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.functions.invoke('whatsapp_sendMessage', {
                whatsapp_contact_id: contact.id,
                nachricht_text: message,
                kategorie: 'service'
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
            setOpen(false);
            setMessage('');
            toast.success('WhatsApp-Nachricht gesendet');
        },
        onError: (error) => {
            toast.error(error.message || 'Fehler beim Senden');
        }
    });

    if (!whatsappAccount || !contact) {
        return null;
    }

    if (contact.opt_in_status !== 'erteilt') {
        return null;
    }

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={() => setOpen(true)}
            >
                <MessageSquare className="w-4 h-4 mr-2" />
                WhatsApp
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>WhatsApp-Nachricht senden</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-emerald-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-emerald-900">{contact.name}</p>
                            <p className="text-xs text-emerald-700">{contact.telefonnummer}</p>
                        </div>

                        {contact.opt_in_status === 'erteilt' ? (
                            <>
                                <Textarea
                                    placeholder="Ihre Nachricht..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                />

                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setOpen(false)}>
                                        Abbrechen
                                    </Button>
                                    <Button
                                        onClick={() => sendMutation.mutate()}
                                        disabled={!message.trim() || sendMutation.isPending}
                                    >
                                        {sendMutation.isPending ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sende...</>
                                        ) : (
                                            <><Send className="w-4 h-4 mr-2" /> Senden</>
                                        )}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div className="text-sm text-amber-900">
                                    <p className="font-medium">Keine Einwilligung</p>
                                    <p className="text-amber-800 mt-1">
                                        Dieser Kontakt hat noch keine Einwilligung für WhatsApp erteilt.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}