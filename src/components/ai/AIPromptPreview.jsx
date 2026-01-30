import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const FEATURE_COLORS = {
    chat: 'bg-blue-100 text-blue-800',
    ocr: 'bg-purple-100 text-purple-800',
    analysis: 'bg-green-100 text-green-800',
    categorization: 'bg-orange-100 text-orange-800',
    document_gen: 'bg-pink-100 text-pink-800',
    recommendation: 'bg-indigo-100 text-indigo-800',
    other: 'bg-slate-100 text-slate-800'
};

export default function AIPromptPreview({ prompt }) {
    const [copied, setCopied] = React.useState(false);

    const handleCopyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(prompt.system_prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success('In Zwischenablage kopiert');
        } catch (error) {
            toast.error('Kopieren fehlgeschlagen');
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{prompt.custom_name}</CardTitle>
                        {prompt.is_active && (
                            <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
                        )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Badge className={FEATURE_COLORS[prompt.feature_key]}>
                            {prompt.feature_key}
                        </Badge>
                        <span className="text-xs text-slate-500">
                            {prompt.usage_count || 0} Nutzungen
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Prompt Preview */}
                <div>
                    <div className="text-sm font-semibold text-slate-700 mb-2">System Prompt:</div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-72 overflow-y-auto">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                            {prompt.system_prompt}
                        </p>
                    </div>
                    <button
                        onClick={handleCopyPrompt}
                        className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3 h-3" />
                                Kopiert
                            </>
                        ) : (
                            <>
                                <Copy className="w-3 h-3" />
                                Kopieren
                            </>
                        )}
                    </button>
                </div>

                {/* Metadata */}
                <div className="pt-4 border-t space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                        <span>Erstellt:</span>
                        <span>{new Date(prompt.created_date).toLocaleDateString('de-DE')}</span>
                    </div>
                    {prompt.last_modified_by && (
                        <div className="flex justify-between">
                            <span>Bearbeitet von:</span>
                            <span>{prompt.last_modified_by}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span>Status:</span>
                        <span>{prompt.is_active ? '✓ Aktiv' : '⊘ Inaktiv'}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}