import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function AIExportManager({ data, title, description }) {
    const [exporting, setExporting] = useState(false);

    async function exportToSlack() {
        setExporting(true);
        try {
            const slackToken = await base44.asServiceRole.connectors.getAccessToken('slack');
            
            const formattedText = `*${title}*\n\n${description}\n\n\`\`\`${JSON.stringify(data, null, 2)}\`\`\``;

            await fetch('https://slack.com/api/chat.postMessage', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${slackToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    channel: '#ai-reports',
                    text: formattedText
                })
            });

            toast.success('Nach Slack exportiert');
        } catch (error) {
            toast.error('Slack-Export fehlgeschlagen');
        } finally {
            setExporting(false);
        }
    }

    async function exportToJSON() {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai_export_${Date.now()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('JSON exportiert');
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Export & Integration
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Button onClick={exportToSlack} disabled={exporting} variant="outline">
                        Slack
                    </Button>
                    <Button onClick={exportToJSON} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        JSON
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}