import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import AICostDisplay from '../ai/AICostDisplay';

export default function InvoiceOCRDialog({ building_id, onSuccess, open, onOpenChange }) {
    const [invoiceType, setInvoiceType] = useState('general');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setPreview(reader.result);
            setImage({ base64: reader.result.split(',')[1], type: file.type });
        };
        reader.readAsDataURL(file);
    };

    async function handleExtract() {
        setLoading(true);
        try {
            const { data } = await base44.functions.invoke('meterInvoiceOCR', {
                imageBase64: image.base64,
                imageMediaType: image.type,
                building_id,
                invoice_type: invoiceType
            });

            if (data.success) {
                setResult(data);
                toast.success(`${data.categorized_meters?.length || 0} Zähler gefunden`);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateMeters() {
        try {
            for (const meter of result.categorized_meters) {
                await base44.entities.Meter.create(meter);
            }
            toast.success(`${result.categorized_meters.length} Zähler erstellt`);
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error('Fehler beim Erstellen');
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Versorgungsrechnung per AI auslesen</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {!result && (
                        <>
                            <div className="space-y-2">
                                <Label>Rechnungstyp</Label>
                                <Select value={invoiceType} onValueChange={setInvoiceType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">Allgemein</SelectItem>
                                        <SelectItem value="energy">Strom/Gas</SelectItem>
                                        <SelectItem value="water">Wasser</SelectItem>
                                        <SelectItem value="heating">Heizkosten</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <label>
                                <input type="file" accept="image/*,application/pdf" onChange={handleFileSelect} className="hidden" />
                                <Button type="button" variant="outline" className="w-full" asChild>
                                    <span><Upload className="w-4 h-4 mr-2" />Rechnung hochladen</span>
                                </Button>
                            </label>

                            {preview && (
                                <div className="border rounded-lg p-4 bg-slate-50">
                                    <img src={preview} alt="Rechnung" className="max-h-96 mx-auto" />
                                </div>
                            )}

                            {image && (
                                <Button onClick={handleExtract} disabled={loading} className="w-full">
                                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                                    {loading ? 'Analysiere...' : 'Rechnung analysieren'}
                                </Button>
                            )}
                        </>
                    )}

                    {result && (
                        <div className="space-y-4">
                            {/* Validation Warnings */}
                            {result.validation_warnings?.length > 0 && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="font-semibold text-yellow-900 mb-1">Warnungen</div>
                                            {result.validation_warnings.map((w, i) => (
                                                <div key={i} className="text-sm text-yellow-800">{w.message}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Extrahierte Daten */}
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <h4 className="font-semibold mb-3">Extrahierte Daten</h4>
                                <pre className="text-xs overflow-auto max-h-48 bg-white p-3 rounded border">
                                    {JSON.stringify(result.extracted_data, null, 2)}
                                </pre>
                            </div>

                            {/* Gefundene Zähler */}
                            {result.categorized_meters?.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-3">Gefundene Zähler ({result.categorized_meters.length})</h4>
                                    <div className="space-y-2">
                                        {result.categorized_meters.map((meter, i) => (
                                            <div key={i} className="p-3 border rounded-lg bg-white">
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-slate-600">Nummer: </span>
                                                        <span className="font-semibold">{meter.zaehler_nummer}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-600">Typ: </span>
                                                        <span>{meter.zaehler_typ}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-600">Einheit: </span>
                                                        <span>{meter.einheit}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI Usage */}
                            {result.usage && <AICostDisplay usage={result.usage} />}

                            {/* Actions */}
                            <div className="flex gap-2">
                                {result.categorized_meters?.length > 0 && (
                                    <Button onClick={handleCreateMeters} className="flex-1">
                                        {result.categorized_meters.length} Zähler erstellen
                                    </Button>
                                )}
                                <Button variant="outline" onClick={() => { setResult(null); setImage(null); }}>
                                    Neue Analyse
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}