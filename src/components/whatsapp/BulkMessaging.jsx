import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkMessaging({ accountId }) {
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [kategorie, setKategorie] = useState('service');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const queryClient = useQueryClient();

    const { data: kontakte = [] } = useQuery({
        queryKey: ['whatsapp-contacts-bulk', accountId],
        queryFn: () => base44.entities.WhatsAppContact.filter({ 
            whatsapp_account_id: accountId,
            opt_in_status: 'erteilt'
        }),
        enabled: !!accountId
    });

    const { data: templates = [] } = useQuery({
        queryKey: ['whatsapp-templates', accountId],
        queryFn: () => base44.entities.WhatsAppTemplate.filter({ 
            whatsapp_account_id: accountId,
            meta_status: 'genehmigt'
        }),
        enabled: !!accountId
    });

    const sendBulkMutation = useMutation({
        mutationFn: async () => {
            const results = {
                erfolg: 0,
                fehler: 0,
                details: []
            };

            for (const contactId of selectedContacts) {
                try {
                    await base44.functions.invoke('whatsapp_sendMessage', {
                        whatsapp_contact_id: contactId,
                        nachricht_text: messageText,
                        kategorie: kategorie
                    });
                    results.erfolg++;
                } catch (error) {
                    results.fehler++;
                    results.details.push({ contactId, error: error.message });
                }
            }

            return results;
        },
        onSuccess: (results) => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
            setSelectedContacts([]);
            setMessageText('');
            toast.success(`${results.erfolg} Nachrichten versendet${results.fehler > 0 ? `, ${results.fehler} Fehler` : ''}`);
        }
    });

    const handleToggleContact = (contactId) => {
        if (selectedContacts.includes(contactId)) {
            setSelectedContacts(selectedContacts.filter(id => id !== contactId));
        } else {
            setSelectedContacts([...selectedContacts, contactId]);
        }
    };

    const handleSelectAll = () => {
        if (selectedContacts.length === kontakte.length) {
            setSelectedContacts([]);
        } else {
            setSelectedContacts(kontakte.map(k => k.id));
        }
    };

    const handleTemplateSelect = (templateId) => {
        setSelectedTemplate(templateId);
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setMessageText(template.body_text);
            setKategorie(template.kategorie);
        }
    };

    const estimatedCosts = selectedContacts.length * (
        kategorie === 'service' ? 0.00 :
        kategorie === 'utility' ? 0.0456 :
        kategorie === 'authentication' ? 0.0636 :
        0.1131
    );

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Massenversand</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="text-sm text-amber-900">
                            <p className="font-medium">Wichtig: DSGVO-Konform versenden</p>
                            <p className="text-amber-800 mt-1">
                                Verwenden Sie Massenversand nur für Service-Nachrichten (z.B. wichtige Informationen).
                                Marketing-Nachrichten benötigen explizite Marketing-Einwilligung!
                            </p>
                        </div>
                    </div>

                    {templates.length > 0 && (
                        <div>
                            <Label>Template verwenden (optional)</Label>
                            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Kein Template" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={null}>Kein Template</SelectItem>
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.anzeige_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div>
                        <Label>Nachricht</Label>
                        <Textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Ihre Nachricht..."
                            rows={6}
                        />
                    </div>

                    <div>
                        <Label>Kategorie</Label>
                        <Select value={kategorie} onValueChange={setKategorie}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="service">Service (kostenlos)</SelectItem>
                                <SelectItem value="utility">Verwaltung (0,05€)</SelectItem>
                                <SelectItem value="authentication">Authentifizierung (0,06€)</SelectItem>
                                <SelectItem value="marketing">Marketing (0,11€)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm text-slate-600">Ausgewählte Kontakte:</span>
                            <span className="font-bold">{selectedContacts.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Geschätzte Kosten:</span>
                            <span className="font-bold">{estimatedCosts.toFixed(2)}€</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Empfänger auswählen ({kontakte.length})</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleSelectAll}>
                            {selectedContacts.length === kontakte.length ? 'Keine' : 'Alle'} auswählen
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {kontakte.map((kontakt) => (
                            <div 
                                key={kontakt.id}
                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50"
                            >
                                <Checkbox
                                    checked={selectedContacts.includes(kontakt.id)}
                                    onCheckedChange={() => handleToggleContact(kontakt.id)}
                                />
                                <div className="flex-1">
                                    <p className="font-medium">{kontakt.name}</p>
                                    <p className="text-sm text-slate-600">{kontakt.telefonnummer}</p>
                                </div>
                                <Badge className="bg-green-100 text-green-800">✓ Einwilligung</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
                <Button
                    onClick={() => sendBulkMutation.mutate()}
                    disabled={selectedContacts.length === 0 || !messageText.trim() || sendBulkMutation.isPending}
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    {sendBulkMutation.isPending ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sende...</>
                    ) : (
                        <><Send className="w-5 h-5 mr-2" /> An {selectedContacts.length} Kontakte senden</>
                    )}
                </Button>
            </div>
        </div>
    );
}