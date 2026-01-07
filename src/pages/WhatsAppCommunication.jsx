import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
    Search, RefreshCw, Send, Paperclip, CheckCheck, 
    Clock, AlertCircle, Info, Loader2, Download, X, FileText as FileTextIcon
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function WhatsAppCommunication() {
    const [selectedContact, setSelectedContact] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState('alle');
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const queryClient = useQueryClient();

    const { data: account } = useQuery({
        queryKey: ['whatsapp-account'],
        queryFn: async () => {
            const accounts = await base44.entities.WhatsAppAccount.list();
            return accounts[0];
        }
    });

    const { data: templates = [] } = useQuery({
        queryKey: ['whatsapp-templates-approved'],
        queryFn: () => base44.entities.WhatsAppTemplate.filter({
            meta_status: 'genehmigt'
        }),
        enabled: !!account
    });

    const { data: kontakte = [] } = useQuery({
        queryKey: ['whatsapp-contacts'],
        queryFn: () => base44.entities.WhatsAppContact.list('-letzter_kontakt'),
        enabled: !!account
    });

    const { data: nachrichten = [] } = useQuery({
        queryKey: ['whatsapp-messages', selectedContact?.id],
        queryFn: () => base44.entities.WhatsAppMessage.filter({
            whatsapp_contact_id: selectedContact.id
        }),
        enabled: !!selectedContact
    });

    const sendMutation = useMutation({
        mutationFn: async (data) => {
            const response = await base44.functions.invoke('whatsapp_sendMessage', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
            setMessageText('');
            toast.success('Nachricht gesendet');
        },
        onError: (error) => {
            toast.error(error.message || 'Fehler beim Senden');
        }
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (contact_id) => {
            await base44.functions.invoke('whatsapp_markAsRead', {
                whatsapp_contact_id: contact_id
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-contacts'] });
            queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
        }
    });

    const syncMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.functions.invoke('whatsapp_syncContacts', {
                whatsapp_account_id: account.id,
                auto_create: true
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-contacts'] });
            toast.success(`${data.neu_angelegt} neue Kontakte synchronisiert`);
        }
    });

    const exportMutation = useMutation({
        mutationFn: async ({ contactId, format }) => {
            const response = await base44.functions.invoke('whatsapp_exportConversation', {
                whatsapp_contact_id: contactId,
                format: format
            });
            return response.data;
        },
        onSuccess: (data) => {
            const blob = new Blob([data.content], { 
                type: data.format === 'json' ? 'application/json' : 'text/plain' 
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            toast.success(`Konversation exportiert (${data.message_count} Nachrichten)`);
        }
    });

    const filteredKontakte = kontakte.filter(k => {
        if (filterTab === 'mieter' && k.kontakt_typ !== 'mieter') return false;
        if (filterTab === 'eigentuemer' && k.kontakt_typ !== 'eigentuemer') return false;
        if (filterTab === 'opted_in' && k.opt_in_status !== 'erteilt') return false;
        if (filterTab === 'opted_out' && k.opt_in_status === 'erteilt') return false;
        if (searchQuery && !k.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const handleSendMessage = async () => {
        if ((!messageText.trim() && !selectedFile) || !selectedContact) return;

        if (selectedFile) {
            // Upload file first
            const formData = new FormData();
            formData.append('file', selectedFile);
            
            const uploadResponse = await base44.integrations.Core.UploadFile({ file: selectedFile });
            
            sendMutation.mutate({
                whatsapp_contact_id: selectedContact.id,
                nachricht_text: messageText || 'Dokument',
                anhang_url: uploadResponse.file_url,
                anhang_dateiname: selectedFile.name,
                typ: 'dokument',
                kategorie: 'service'
            });
            setSelectedFile(null);
        } else {
            sendMutation.mutate({
                whatsapp_contact_id: selectedContact.id,
                nachricht_text: messageText,
                kategorie: 'service'
            });
        }
    };

    const handleTemplateSelect = (templateId) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setMessageText(template.body_text);
            setSelectedTemplate(templateId);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 16 * 1024 * 1024) {
                toast.error('Datei ist zu groß (max. 16MB)');
                return;
            }
            setSelectedFile(file);
        }
    };

    React.useEffect(() => {
        if (selectedContact && selectedContact.ungelesene_nachrichten > 0) {
            markAsReadMutation.mutate(selectedContact.id);
        }
    }, [selectedContact?.id]);

    if (!account) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Card className="p-6 text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">WhatsApp nicht eingerichtet</h2>
                    <p className="text-slate-600 mb-4">
                        Richten Sie zuerst einen WhatsApp Business Account ein.
                    </p>
                    <Button onClick={() => window.location.href = '/kommunikation/whatsapp/einrichtung'}>
                        Jetzt einrichten
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Kontaktliste */}
            <div className="w-96 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200">
                    <h2 className="text-lg font-bold mb-3">WhatsApp-Kontakte ({kontakte.length})</h2>
                    
                    <div className="flex gap-2 mb-3 overflow-x-auto">
                        <Button size="sm" variant={filterTab === 'alle' ? 'default' : 'outline'}
                            onClick={() => setFilterTab('alle')}>
                            Alle
                        </Button>
                        <Button size="sm" variant={filterTab === 'mieter' ? 'default' : 'outline'}
                            onClick={() => setFilterTab('mieter')}>
                            Mieter
                        </Button>
                        <Button size="sm" variant={filterTab === 'eigentuemer' ? 'default' : 'outline'}
                            onClick={() => setFilterTab('eigentuemer')}>
                            Eigentümer
                        </Button>
                        <Button size="sm" variant={filterTab === 'opted_in' ? 'default' : 'outline'}
                            onClick={() => setFilterTab('opted_in')}>
                            ✓ Einwilligung
                        </Button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Kontakt suchen..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredKontakte.map((kontakt) => (
                        <div
                            key={kontakt.id}
                            onClick={() => setSelectedContact(kontakt)}
                            className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${
                                selectedContact?.id === kontakt.id ? 'bg-emerald-50' : ''
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <Avatar>
                                    <AvatarFallback>{kontakt.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900 truncate">{kontakt.name}</p>
                                    <p className="text-sm text-slate-600 truncate">{kontakt.telefonnummer}</p>
                                    <div className="flex gap-2 mt-1">
                                        <Badge variant={kontakt.opt_in_status === 'erteilt' ? 'default' : 'secondary'}
                                            className={kontakt.opt_in_status === 'erteilt' ? 'bg-green-100 text-green-800' : ''}>
                                            {kontakt.opt_in_status === 'erteilt' ? '✓' : '⚠'} 
                                            {kontakt.opt_in_status === 'erteilt' ? 'Einwilligung' : 'Keine Einwilligung'}
                                        </Badge>
                                    </div>
                                    {kontakt.letzter_kontakt && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            {format(new Date(kontakt.letzter_kontakt), 'dd.MM.yyyy HH:mm', { locale: de })}
                                        </p>
                                    )}
                                </div>
                                {kontakt.ungelesene_nachrichten > 0 && (
                                    <Badge className="bg-emerald-600">{kontakt.ungelesene_nachrichten}</Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-200">
                    <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="w-full">
                        {syncMutation.isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Synchronisiere...</>
                        ) : (
                            <><RefreshCw className="w-4 h-4 mr-2" /> Kontakte synchronisieren</>
                        )}
                    </Button>
                </div>
            </div>

            {/* Chat-Bereich */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedContact ? (
                    <>
                        {/* Chat-Header */}
                        <div className="p-4 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>{selectedContact.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-slate-900">{selectedContact.name}</p>
                                        <p className="text-sm text-slate-600">{selectedContact.telefonnummer}</p>
                                        <Badge variant={selectedContact.opt_in_status === 'erteilt' ? 'default' : 'secondary'}
                                            className={selectedContact.opt_in_status === 'erteilt' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                                            {selectedContact.opt_in_status === 'erteilt' ? '✓ Einwilligung' : '⚠ Keine Einwilligung'}
                                        </Badge>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => exportMutation.mutate({ contactId: selectedContact.id, format: 'txt' })}
                                    disabled={exportMutation.isPending}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export
                                </Button>
                            </div>
                        </div>

                        {/* Nachrichten */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {nachrichten.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.richtung === 'ausgehend' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-md rounded-lg p-3 ${
                                       msg.richtung === 'ausgehend' 
                                           ? 'bg-emerald-600 text-white' 
                                           : 'bg-white border border-slate-200'
                                    }`}>
                                       {msg.anhang_url && (
                                           <div className="mb-2 pb-2 border-b border-emerald-500">
                                               <a
                                                   href={msg.anhang_url}
                                                   target="_blank"
                                                   rel="noopener noreferrer"
                                                   className="flex items-center gap-2 text-sm underline"
                                               >
                                                   <Paperclip className="w-3 h-3" />
                                                   {msg.anhang_dateiname || 'Anhang'}
                                               </a>
                                           </div>
                                       )}
                                       <p className="text-sm">{msg.nachricht_text}</p>
                                       <div className="flex items-center gap-2 mt-1">
                                           <p className="text-xs opacity-70">
                                               {format(new Date(msg.created_at), 'HH:mm', { locale: de })}
                                           </p>
                                           {msg.richtung === 'ausgehend' && (
                                               <>
                                                   {msg.status === 'gelesen' && <CheckCheck className="w-3 h-3 text-blue-300" />}
                                                   {msg.status === 'zugestellt' && <CheckCheck className="w-3 h-3" />}
                                                   {msg.status === 'gesendet' && <Clock className="w-3 h-3" />}
                                               </>
                                           )}
                                       </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Eingabe */}
                        <div className="p-4 border-t border-slate-200">
                            {selectedContact.opt_in_status === 'erteilt' ? (
                                <div className="space-y-2">
                                    {templates.length > 0 && (
                                        <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Template verwenden (optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {templates.map(t => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        {t.anzeige_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {selectedFile && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileTextIcon className="w-4 h-4 text-slate-600" />
                                                <span className="text-sm text-slate-700">{selectedFile.name}</span>
                                                <span className="text-xs text-slate-500">
                                                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedFile(null)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                    <Textarea
                                        placeholder="Nachricht schreiben..."
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        rows={3}
                                    />
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => document.getElementById('file-upload').click()}
                                            >
                                                <Paperclip className="w-4 h-4 mr-2" />
                                                Anhang
                                            </Button>
                                            <input
                                                id="file-upload"
                                                type="file"
                                                className="hidden"
                                                onChange={handleFileSelect}
                                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            />
                                        </div>
                                        <Button 
                                            onClick={handleSendMessage} 
                                            disabled={sendMutation.isPending || (!messageText.trim() && !selectedFile)}
                                        >
                                            {sendMutation.isPending ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4 mr-2" />
                                            )}
                                            Senden
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                                    <AlertCircle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                                    <p className="font-medium text-amber-900">Keine Einwilligung vorhanden</p>
                                    <p className="text-sm text-amber-800 mt-1">
                                        Sie können diesem Kontakt keine Nachrichten senden, 
                                        bis eine Einwilligung vorliegt.
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center">
                        <div>
                            <Info className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-600">Wählen Sie einen Kontakt aus, um die Konversation zu sehen</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}