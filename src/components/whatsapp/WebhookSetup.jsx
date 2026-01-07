import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Webhook, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function WebhookSetup({ accountId }) {
    const { data: webhookInfo } = useQuery({
        queryKey: ['webhook-info', accountId],
        queryFn: async () => {
            const response = await base44.functions.invoke('whatsapp_getWebhookUrl', {
                whatsapp_account_id: accountId
            });
            return response.data;
        },
        enabled: !!accountId
    });

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('In Zwischenablage kopiert');
    };

    if (!webhookInfo) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Webhook className="w-5 h-5" />
                    Webhook-Einrichtung
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700">Webhook-URL</label>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(webhookInfo.webhook_url)}
                        >
                            <Copy className="w-4 h-4 mr-1" />
                            Kopieren
                        </Button>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg font-mono text-sm break-all">
                        {webhookInfo.webhook_url}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700">Webhook-Secret</label>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(webhookInfo.webhook_secret)}
                        >
                            <Copy className="w-4 h-4 mr-1" />
                            Kopieren
                        </Button>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg font-mono text-sm">
                        {webhookInfo.webhook_secret}
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-blue-900 mb-2">
                                Einrichtung bei {webhookInfo.anbieter}
                            </p>
                            <pre className="text-sm text-blue-800 whitespace-pre-wrap">
                                {webhookInfo.instructions}
                            </pre>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-slate-600">
                        Events: message.received, message.status
                    </span>
                    <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Konfiguriert
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}