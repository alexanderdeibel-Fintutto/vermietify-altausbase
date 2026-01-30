import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import AIUsageIndicator from '../ai/AIUsageIndicator';
import AICostDisplay from '../ai/AICostDisplay';

export default function BelegScanner() {
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

    const handleScan = async () => {
        if (!image) return;

        setLoading(true);
        try {
            const response = await base44.functions.invoke('aiCoreService', {
                action: 'ocr',
                prompt: 'Analysiere diesen Beleg und extrahiere: typ, haendler{name}, datum, betraege{brutto, netto, mwst_19}, kategorie_vorschlag, skr03_konto, steuerlich_absetzbar, notizen',
                systemPrompt: 'Du bist ein Experte für Buchhaltung und Belegverarbeitung. Extrahiere alle relevanten Daten strukturiert aus dem Beleg.',
                imageBase64: image.base64,
                imageMediaType: image.type,
                userId: user?.email,
                featureKey: 'ocr',
                maxTokens: 2048
            });

            if (response.data.success) {
                const parsed = JSON.parse(response.data.content);
                setResult(parsed);
                setUsageStats(response.data.usage);
                toast.success('Beleg erfolgreich analysiert');
            } else {
                toast.error(response.data.error || 'Fehler beim Scannen');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;

        try {
            await base44.entities.Invoice.create({
                description: result.haendler?.name || 'Beleg',
                amount: result.betraege?.brutto || 0,
                date: result.datum,
                category: result.kategorie_vorschlag,
                tax_deductible: result.steuerlich_absetzbar,
                notes: result.notizen
            });
            toast.success('Beleg gespeichert');
            setResult(null);
            setImage(null);
            setImagePreview(null);
        } catch (error) {
            toast.error('Fehler beim Speichern');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Camera className="w-5 h-5" />
                            Beleg-Scanner
                        </div>
                        {user && <AIUsageIndicator userId={user.email} />}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!result && (
                        <>
                            <div className="flex gap-4">
                                <label className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <Button type="button" variant="outline" className="w-full" asChild>
                                        <span>
                                            <Camera className="w-4 h-4 mr-2" />
                                            Foto aufnehmen
                                        </span>
                                    </Button>
                                </label>
                                <label className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <Button type="button" variant="outline" className="w-full" asChild>
                                        <span>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Datei auswählen
                                        </span>
                                    </Button>
                                </label>
                            </div>

                            {imagePreview && (
                                <>
                                    <div className="border rounded-lg p-4 bg-slate-50">
                                        <img src={imagePreview} alt="Beleg" className="max-h-96 mx-auto" />
                                    </div>
                                    <Button onClick={handleScan} disabled={loading} className="w-full">
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Analysiere Beleg...
                                            </>
                                        ) : (
                                            'Beleg analysieren'
                                        )}
                                    </Button>
                                </>
                            )}
                        </>
                    )}

                    {result && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-green-600 mb-4">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-semibold">Erkannte Daten</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Typ</Label>
                                    <Input value={result.typ || ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Händler</Label>
                                    <Input value={result.haendler?.name || ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Datum</Label>
                                    <Input value={result.datum || ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Brutto</Label>
                                    <Input value={`${result.betraege?.brutto || 0} €`} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>MwSt 19%</Label>
                                    <Input value={`${result.betraege?.mwst_19 || 0} €`} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Netto</Label>
                                    <Input value={`${result.betraege?.netto || 0} €`} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Kategorie</Label>
                                    <Input value={result.kategorie_vorschlag || ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>SKR03</Label>
                                    <Input value={result.skr03_konto || ''} readOnly />
                                </div>
                            </div>

                            {result.notizen && (
                                <div className="space-y-2">
                                    <Label>Notizen</Label>
                                    <div className="p-3 bg-slate-50 rounded-md text-sm">{result.notizen}</div>
                                </div>
                            )}

                            {usageStats && <AICostDisplay usage={usageStats} />}

                            <div className="flex gap-2 pt-4">
                                <Button onClick={handleSave} className="flex-1">
                                    Beleg speichern
                                </Button>
                                <Button variant="outline" onClick={() => {
                                    setResult(null);
                                    setImage(null);
                                    setImagePreview(null);
                                    setUsageStats(null);
                                }}>
                                    Neuer Scan
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}