import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import AIUsageIndicator from '../ai/AIUsageIndicator';
import AICostDisplay from '../ai/AICostDisplay';

export default function DokumentZusammenfasser() {
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [user, setUser] = useState(null);
    const [usageStats, setUsageStats] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    async function loadUser() {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
    }

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
            const response = await base44.functions.invoke('aiCoreService', {
                action: 'analysis',
                prompt: 'Fasse dieses Dokument zusammen. Gib zurück: titel, dokument_typ, zusammenfassung{kurz}, kernpunkte[], handlungsbedarf{vorhanden: boolean, aktionen[{was, bis_wann}]}',
                systemPrompt: 'Du bist ein Dokumentenanalyst. Fasse Dokumente strukturiert zusammen.',
                imageBase64: image.base64,
                imageMediaType: image.type,
                userId: user?.email,
                featureKey: 'analysis',
                maxTokens: 3072
            });

            if (response.data.success) {
                const parsed = JSON.parse(response.data.content);
                setResult(parsed);
                setUsageStats(response.data.usage);
                toast.success('Dokument zusammengefasst');
            } else {
                toast.error(response.data.error || 'Fehler beim Zusammenfassen');
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
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Dokument-Zusammenfasser
                        </div>
                        {user && <AIUsageIndicator userId={user.email} />}
                    </CardTitle>
                    <p className="text-sm text-slate-600">Lade ein Dokument - ich fasse es strukturiert zusammen</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!result && (
                        <>
                            <label>
                                <input type="file" accept="image/*,application/pdf" onChange={handleFileSelect} className="hidden" />
                                <Button type="button" variant="outline" className="w-full" asChild>
                                    <span><Upload className="w-4 h-4 mr-2" />Dokument hochladen</span>
                                </Button>
                            </label>

                            {imagePreview && (
                                <>
                                    <div className="border rounded-lg p-4 bg-slate-50">
                                        <img src={imagePreview} alt="Dokument" className="max-h-96 mx-auto" />
                                    </div>
                                    <Button onClick={handleAnalyze} disabled={loading} className="w-full">
                                        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analysiere...</> : 'Dokument zusammenfassen'}
                                    </Button>
                                </>
                            )}
                        </>
                    )}

                    {result && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold mb-2">{result.titel}</h3>
                                <div className="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">
                                    {result.dokument_typ}
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="font-semibold mb-2">📝 Kurz-Zusammenfassung</div>
                                <div className="text-sm">{result.zusammenfassung?.kurz}</div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-3">🔑 Kernpunkte</h3>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    {result.kernpunkte?.map((punkt, idx) => (
                                        <li key={idx}>{punkt}</li>
                                    ))}
                                </ul>
                            </div>

                            {result.handlungsbedarf?.vorhanden && (
                                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="flex items-center gap-2 font-semibold mb-3 text-orange-800">
                                        <AlertCircle className="w-5 h-5" />
                                        Handlungsbedarf
                                    </div>
                                    <div className="space-y-2">
                                        {result.handlungsbedarf.aktionen?.map((aktion, idx) => (
                                            <div key={idx} className="text-sm">
                                                <div className="font-medium">{aktion.was}</div>
                                                {aktion.bis_wann && <div className="text-slate-600">Frist: {aktion.bis_wann}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {usageStats && <AICostDisplay usage={usageStats} />}

                            <Button variant="outline" onClick={() => { setResult(null); setImage(null); setImagePreview(null); setUsageStats(null); }}>
                                Neues Dokument
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}