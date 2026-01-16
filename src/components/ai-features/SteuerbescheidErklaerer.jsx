import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function SteuerbescheidErklaerer() {
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [erklaerung, setErklaerung] = useState(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result);
            const base64 = reader.result.split(',')[1];
            setImage({ base64, type: file.type });
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyze = async () => {
        if (!image) return;

        setLoading(true);
        try {
            const response = await base44.functions.invoke('erklaereSteuerbescheid', {
                imageBase64: image.base64,
                imageMediaType: image.type
            });

            if (response.data.success) {
                setErklaerung(response.data);
                toast.success('Steuerbescheid analysiert');
            } else {
                toast.error(response.data.error || 'Fehler bei der Analyse');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Steuerbescheid-Erklärer
                    </CardTitle>
                    <p className="text-sm text-slate-600">Lade deinen Bescheid hoch - ich erkläre dir alles!</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!erklaerung && (
                        <>
                            <label>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <Button type="button" variant="outline" className="w-full" asChild>
                                    <span>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Steuerbescheid hochladen (Foto oder PDF)
                                    </span>
                                </Button>
                            </label>

                            {imagePreview && (
                                <>
                                    <div className="border rounded-lg p-4 bg-slate-50">
                                        <img src={imagePreview} alt="Steuerbescheid" className="max-h-96 mx-auto" />
                                    </div>
                                    <Button onClick={handleAnalyze} disabled={loading} className="w-full">
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Analysiere Bescheid...
                                            </>
                                        ) : (
                                            'Bescheid erklären'
                                        )}
                                    </Button>
                                </>
                            )}
                        </>
                    )}

                    {erklaerung && (
                        <div className="space-y-6">
                            <div className="prose prose-slate max-w-none">
                                <ReactMarkdown>{erklaerung.erklaerung}</ReactMarkdown>
                            </div>

                            <div className="flex gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={() => {
                                    setErklaerung(null);
                                    setImage(null);
                                    setImagePreview(null);
                                }}>
                                    Neuer Bescheid
                                </Button>
                            </div>

                            <div className="text-xs text-slate-500 text-center">
                                Kosten: {erklaerung.meta?.costEur?.toFixed(4)} € | Provider: {erklaerung.meta?.provider}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}