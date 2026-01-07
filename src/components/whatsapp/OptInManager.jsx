import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Send, CheckCircle, AlertCircle, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function OptInManager({ accountId }) {
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();

    const { data: kontakte = [] } = useQuery({
        queryKey: ['whatsapp-contacts-opt-in', accountId],
        queryFn: () => base44.entities.WhatsAppContact.filter({ 
            whatsapp_account_id: accountId 
        }),
        enabled: !!accountId
    });

    const { data: optIns = [] } = useQuery({
        queryKey: ['whatsapp-opt-ins'],
        queryFn: () => base44.entities.WhatsAppOptIn.list('-erteilt_am')
    });

    const sendOptInEmailMutation = useMutation({
        mutationFn: async (contactIds) => {
            const response = await base44.functions.invoke('whatsapp_sendOptInEmail', {
                whatsapp_account_id: accountId,
                contact_ids: contactIds
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-contacts-opt-in'] });
            setSelectedContacts([]);
            toast.success(`${data.sent_count} Einwilligungs-E-Mails versendet`);
        },
        onError: (error) => {
            toast.error(error.message || 'Fehler beim Versenden');
        }
    });

    const filteredKontakte = kontakte.filter(k => 
        !searchQuery || k.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: kontakte.length,
        erteilt: kontakte.filter(k => k.opt_in_status === 'erteilt').length,
        ausstehend: kontakte.filter(k => k.opt_in_status === 'ausstehend').length,
        abgelehnt: kontakte.filter(k => k.opt_in_status === 'abgelehnt').length
    };

    const handleToggleContact = (contactId) => {
        if (selectedContacts.includes(contactId)) {
            setSelectedContacts(selectedContacts.filter(id => id !== contactId));
        } else {
            setSelectedContacts([...selectedContacts, contactId]);
        }
    };

    const handleSelectAll = () => {
        const ausstehende = filteredKontakte.filter(k => k.opt_in_status === 'ausstehend');
        if (selectedContacts.length === ausstehende.length) {
            setSelectedContacts([]);
        } else {
            setSelectedContacts(ausstehende.map(k => k.id));
        }
    };

    const getOptInDetails = (contactId) => {
        return optIns.filter(opt => opt.whatsapp_contact_id === contactId);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Einwilligungs-Verwaltung</h3>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Users className="w-8 h-8 text-slate-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-slate-600">Gesamt</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.erteilt}</p>
                                <p className="text-xs text-slate-600">Erteilt</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-8 h-8 text-amber-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.ausstehend}</p>
                                <p className="text-xs text-slate-600">Ausstehend</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.abgelehnt}</p>
                                <p className="text-xs text-slate-600">Abgelehnt</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex gap-2">
                <Input
                    placeholder="Kontakt suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                />
                <Button 
                    variant="outline"
                    onClick={handleSelectAll}
                >
                    {selectedContacts.length === filteredKontakte.filter(k => k.opt_in_status === 'ausstehend').length ? 'Keine' : 'Alle'} auswählen
                </Button>
                <Button
                    onClick={() => sendOptInEmailMutation.mutate(selectedContacts)}
                    disabled={selectedContacts.length === 0 || sendOptInEmailMutation.isPending}
                >
                    {sendOptInEmailMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sende...</>
                    ) : (
                        <><Mail className="w-4 h-4 mr-2" /> Einwilligungs-E-Mail senden ({selectedContacts.length})</>
                    )}
                </Button>
            </div>

            <div className="space-y-2">
                {filteredKontakte.map((kontakt) => {
                    const optInHistory = getOptInDetails(kontakt.id);
                    const latestOptIn = optInHistory[0];
                    
                    return (
                        <Card key={kontakt.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    {kontakt.opt_in_status === 'ausstehend' && (
                                        <Checkbox
                                            checked={selectedContacts.includes(kontakt.id)}
                                            onCheckedChange={() => handleToggleContact(kontakt.id)}
                                        />
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="font-medium">{kontakt.name}</p>
                                                <p className="text-sm text-slate-600">{kontakt.telefonnummer}</p>
                                            </div>
                                            <Badge className={
                                                kontakt.opt_in_status === 'erteilt' ? 'bg-green-100 text-green-800' :
                                                kontakt.opt_in_status === 'abgelehnt' ? 'bg-red-100 text-red-800' :
                                                'bg-amber-100 text-amber-800'
                                            }>
                                                {kontakt.opt_in_status === 'erteilt' ? '✓ Einwilligung erteilt' :
                                                 kontakt.opt_in_status === 'abgelehnt' ? 'Abgelehnt' :
                                                 '⚠ Ausstehend'}
                                            </Badge>
                                        </div>
                                        
                                        {latestOptIn && (
                                            <div className="text-xs text-slate-500 space-y-1">
                                                <p>
                                                    Methode: {latestOptIn.methode}
                                                    {' • '}
                                                    {latestOptIn.status === 'erteilt' ? 'Erteilt' : 'Widerrufen'} am{' '}
                                                    {format(new Date(latestOptIn.erteilt_am || latestOptIn.widerrufen_am), 'dd.MM.yyyy HH:mm', { locale: de })}
                                                </p>
                                                {optInHistory.length > 1 && (
                                                    <p className="text-blue-600">
                                                        {optInHistory.length} Einträge in Historie
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {kontakt.opt_in_datum && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                Einwilligung am {format(new Date(kontakt.opt_in_datum), 'dd.MM.yyyy', { locale: de })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}