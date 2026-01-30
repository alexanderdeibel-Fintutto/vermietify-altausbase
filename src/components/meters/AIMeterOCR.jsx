import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import AICostDisplay from '../ai/AICostDisplay';

export default function AIMeterOCR({ building_id, onMeterCreated }) {
    const [showDialog, setShowDialog] = useState(false);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [extractedData, setExtractedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [usageStats, setUsageStats] = useState(null);

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

    async function handleExtract() {
        if (!image) return;

        setLoading(true);
        try {
            const { data } = await base44.functions.invoke('meterAIExtract', {
                imageBase64: image.base64,
                imageMediaType: image.type,
                building_id
            });

            if (data.success) {
                setExtractedData(data.extracted_data);
                setUsageStats(data.usage);
                toast.success('Zähler-Daten extrahiert');
            } else {
                toast.error(data.error || 'Extraktion fehlgeschlagen');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveMeter() {
        try {
            await base44.entities.Meter.create(extractedData);
            toast.success('Zähler erstellt');
            setShowDialog(false);
            setImage(null);
            setExtractedData(null);
            if (onMeterCreated) onMeterCreated();
        } catch (error) {
            toast.error('Fehler beim Speichern');
        }
    }

    return (
        <>
            <Button onClick={() => setShowDialog(true)} variant="outline">
                <Camera className="w-4 h-4 mr-2" />
                Zähler per OCR hinzufügen
            </Button>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Zähler mit AI-OCR erfassen</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {!extractedData && (
                            <>
                                <label>
                                    <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                                    <Button type="button" variant="outline" className="w-full" asChild>
                                        <span><Camera className="w-4 h-4 mr-2" />Foto von Zähler aufnehmen</span>
                                    </Button>
                                </label>

                                {imagePreview && (
                                    <>
                                        <div className="border rounded-lg p-4 bg-slate-50">
                                            <img src={imagePreview} alt="Zähler" className="max-h-64 mx-auto" />
                                        </div>
                                        <Button onClick={handleExtract} disabled={loading} className="w-full">
                                            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Extrahiere...</> : 'Zähler-Daten auslesen'}
                                        </Button>
                                    </>
                                )}
                            </>
                        )}

                        {extractedData && (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 font-semibold text-green-700 mb-2">
                                        <CheckCircle className="w-5 h-5" />
                                        Zähler-Daten erfolgreich extrahiert
                                    </div>
                                </div>

                                {extractedData.eichung_warnung && (
                                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-orange-700">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span className="text-sm font-medium">
                                                Eichung läuft bald ab: {extractedData.eichung_bis}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Zählernummer</Label>
                                        <Input value={extractedData.zaehler_nummer} readOnly />
                                    </div>
                                    <div>
                                        <Label>Zählertyp</Label>
                                        <Input value={extractedData.zaehler_typ} readOnly />
                                    </div>
                                    <div>
                                        <Label>Standort</Label>
                                        <Input value={extractedData.standort || ''} readOnly />
                                    </div>
                                    <div>
                                        <Label>Versorger</Label>
                                        <Input value={extractedData.versorger || ''} readOnly />
                                    </div>
                                    <div>
                                        <Label>Einheit</Label>
                                        <Input value={extractedData.einheit} readOnly />
                                    </div>
                                    <div>
                                        <Label>Kategorie (Vorschlag)</Label>
                                        <Input value={extractedData.kategorie_vorschlag} readOnly />
                                    </div>
                                </div>

                                {usageStats && <AICostDisplay usage={usageStats} />}

                                <div className="flex gap-2">
                                    <Button onClick={handleSaveMeter} className="flex-1">
                                        Zähler speichern
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => { setExtractedData(null); setImage(null); }}
                                    >
                                        Abbrechen
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}