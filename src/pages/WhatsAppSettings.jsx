import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings, MessageSquare, Mail, FileText, BarChart3, Users } from 'lucide-react';
import TemplateManager from '../components/whatsapp/TemplateManager';
import OptInManager from '../components/whatsapp/OptInManager';
import WhatsAppDashboard from '../components/whatsapp/WhatsAppDashboard';
import BulkMessaging from '../components/whatsapp/BulkMessaging';
import WebhookSetup from '../components/whatsapp/WebhookSetup';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function WhatsAppSettings() {
    const navigate = useNavigate();

    const { data: account } = useQuery({
        queryKey: ['whatsapp-account'],
        queryFn: async () => {
            const accounts = await base44.entities.WhatsAppAccount.list();
            return accounts[0];
        }
    });

    if (!account) {
        return (
            <div className="p-6">
                <Card className="max-w-md mx-auto">
                    <CardContent className="p-6 text-center">
                        <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">WhatsApp nicht eingerichtet</h2>
                        <p className="text-slate-600 mb-4">
                            Richten Sie zuerst einen WhatsApp Business Account ein.
                        </p>
                        <Button onClick={() => navigate(createPageUrl('WhatsAppSetup'))}>
                            Jetzt einrichten
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">WhatsApp Einstellungen</h1>
                <p className="text-slate-600 mt-2">
                    Verwalten Sie Templates, Einwilligungen und Account-Einstellungen
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Account-Informationen
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-slate-600">Anbieter</p>
                            <p className="font-medium">{account.anbieter}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">WhatsApp Nummer</p>
                            <p className="font-medium">{account.telefonnummer}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Anzeigename</p>
                            <p className="font-medium">{account.display_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Status</p>
                            <p className="font-medium">{account.status}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Monatlicher Verbrauch</p>
                            <p className="font-medium">{account.aktueller_verbrauch.toFixed(2)} EUR</p>
                        </div>
                        {account.monatliches_budget && (
                            <div>
                                <p className="text-sm text-slate-600">Budget</p>
                                <p className="font-medium">{account.monatliches_budget.toFixed(2)} EUR</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="dashboard">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="dashboard">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="bulk">
                        <Users className="w-4 h-4 mr-2" />
                        Massenversand
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        <FileText className="w-4 h-4 mr-2" />
                        Templates
                    </TabsTrigger>
                    <TabsTrigger value="opt-in">
                        <Mail className="w-4 h-4 mr-2" />
                        Einwilligungen
                    </TabsTrigger>
                    <TabsTrigger value="webhook">
                        <Settings className="w-4 h-4 mr-2" />
                        Webhook
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="dashboard" className="mt-6">
                    <WhatsAppDashboard accountId={account.id} />
                </TabsContent>
                <TabsContent value="bulk" className="mt-6">
                    <BulkMessaging accountId={account.id} />
                </TabsContent>
                <TabsContent value="templates" className="mt-6">
                    <TemplateManager accountId={account.id} />
                </TabsContent>
                <TabsContent value="opt-in" className="mt-6">
                    <OptInManager accountId={account.id} />
                </TabsContent>
                <TabsContent value="webhook" className="mt-6">
                    <WebhookSetup accountId={account.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}