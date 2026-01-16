import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function BuchungsKategorisierer() {
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

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
            const response = await base44.functions.invoke('kategorisiereBuchungen', {
                imageBase64: image.base64,
                imageMediaType: image.type
            });

            if (response.data.success) {
                setResult(response.data.data);
                toast.success('Buchungen kategorisiert');
            } else {
                toast.error(response.data.error || 'Fehler bei der Kategorisierung');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>📊 Buchungs-Kategorisierer (SKR03)</CardTitle>
                    <p className="text-sm text-slate-600">Lade eine Liste von Buchungen - ich ordne sie automatisch SKR03-Konten zu</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!result && (
                        <>
                            <label>
                                <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                                <Button type="button" variant="outline" className="w-full" asChild>
                                    <span><Upload className="w-4 h-4 mr-2" />Buchungsliste hochladen</span>
                                </Button>
                            </label>

                            {imagePreview && (
                                <>
                                    <div className="border rounded-lg p-4 bg-slate-50">
                                        <img src={imagePreview} alt="Buchungen" className="max-h-96 mx-auto" />
                                    </div>
                                    <Button onClick={handleAnalyze} disabled={loading} className="w-full">
                                        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Kategorisiere...</> : 'Buchungen kategorisieren'}
                                    </Button>
                                </>
                            )}
                        </>
                    )}

                    {result && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{result.zusammenfassung?.anzahl_buchungen || 0}</div>
                                        <div className="text-sm text-slate-600">Buchungen</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold text-green-600">{result.zusammenfassung?.summe_einnahmen?.toFixed(2) || 0} €</div>
                                        <div className="text-sm text-slate-600">Einnahmen</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold text-red-600">{result.zusammenfassung?.summe_ausgaben?.toFixed(2) || 0} €</div>
                                        <div className="text-sm text-slate-600">Ausgaben</div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-3">Kategorisierte Buchungen</h3>
                                <div className="space-y-2">
                                    {result.buchungen?.map((buchung, idx) => (
                                        <div key={idx} className="p-3 border rounded-lg hover:bg-slate-50">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="font-medium">{buchung.beschreibung}</div>
                                                    <div className="text-sm text-slate-600">
                                                        {buchung.skr03_konto} - {buchung.konto_bezeichnung}
                                                    </div>
                                                </div>
                                                <div className={`font-semibold ${buchung.typ === 'einnahme' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {buchung.betrag?.toFixed(2)} €
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button variant="outline" onClick={() => { setResult(null); setImage(null); setImagePreview(null); }}>
                                Neue Analyse
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}