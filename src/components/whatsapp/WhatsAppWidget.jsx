import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function WhatsAppWidget() {
    const navigate = useNavigate();

    const { data: account } = useQuery({
        queryKey: ['whatsapp-account'],
        queryFn: async () => {
            const accounts = await base44.entities.WhatsAppAccount.list();
            return accounts[0];
        }
    });

    const { data: unreadContacts = [] } = useQuery({
        queryKey: ['whatsapp-unread'],
        queryFn: async () => {
            if (!account) return [];
            const kontakte = await base44.entities.WhatsAppContact.filter({
                whatsapp_account_id: account.id
            });
            return kontakte.filter(k => k.ungelesene_nachrichten > 0);
        },
        enabled: !!account,
        refetchInterval: 30000
    });

    if (!account) {
        return null;
    }

    const totalUnread = unreadContacts.reduce((sum, k) => sum + k.ungelesene_nachrichten, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <motion.div
                            animate={{ rotate: totalUnread > 0 ? [0, -10, 10, 0] : 0 }}
                            transition={{ repeat: totalUnread > 0 ? Infinity : 0, duration: 2 }}
                        >
                            <MessageSquare className="w-5 h-5 text-emerald-600" />
                        </motion.div>
                        WhatsApp
                    </div>
                    <AnimatePresence mode="wait">
                        {totalUnread > 0 && (
                            <motion.div
                                key={totalUnread}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                            >
                                <Badge className="bg-emerald-600">{totalUnread}</Badge>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {unreadContacts.length > 0 ? (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {unreadContacts.slice(0, 3).map((kontakt, idx) => (
                                <motion.div 
                                    key={kontakt.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center justify-between p-2 bg-slate-50 rounded"
                                >
                                    <div>
                                        <p className="font-medium text-sm">{kontakt.name}</p>
                                        <p className="text-xs text-slate-600">
                                            {kontakt.ungelesene_nachrichten} neue Nachricht{kontakt.ungelesene_nachrichten > 1 ? 'en' : ''}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button 
                                onClick={() => navigate(createPageUrl('WhatsAppCommunication'))}
                                className="w-full mt-2"
                                size="sm"
                            >
                                Alle anzeigen
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </motion.div>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-sm text-slate-600">Keine neuen Nachrichten</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(createPageUrl('WhatsAppCommunication'))}
                            className="mt-2"
                        >
                            Zu WhatsApp
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}