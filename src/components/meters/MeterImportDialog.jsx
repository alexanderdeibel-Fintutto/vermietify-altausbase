import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from "@/components/ui/card";
import LocationTreeSelect from './LocationTreeSelect';

const METER_FIELDS = [
    { key: 'meter_type', label: 'Art', required: true },
    { key: 'meter_number', label: 'Nummer', required: true },
    { key: 'location_description', label: 'Ortsbeschreibung', required: false }
];

export default function MeterImportDialog({ open, onOpenChange, onImport, building }) {
    const [csvData, setCsvData] = useState(null);
    const [csvColumns, setCsvColumns] = useState([]);
    const [fieldMapping, setFieldMapping] = useState({});
    const [defaultLocation, setDefaultLocation] = useState({ type: null, index: null });
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) return;

            // Parse CSV (simple parser - assumes comma-separated)
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const rows = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                const row = {};
                headers.forEach((header, idx) => {
                    row[header] = values[idx] || '';
                });
                return row;
            });

            setCsvColumns(headers);
            setCsvData(rows);
            setImportResult(null);
            
            // Auto-map if column names match
            const autoMapping = {};
            METER_FIELDS.forEach(field => {
                const matchingColumn = headers.find(h => 
                    h.toLowerCase().includes(field.key.toLowerCase()) ||
                    field.label.toLowerCase().includes(h.toLowerCase())
                );
                if (matchingColumn) {
                    autoMapping[field.key] = matchingColumn;
                }
            });
            setFieldMapping(autoMapping);
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (!csvData || csvData.length === 0) return;

        // Validate required mappings
        const missingFields = METER_FIELDS.filter(f => f.required && !fieldMapping[f.key]);
        if (missingFields.length > 0) {
            alert(`Bitte ordnen Sie die erforderlichen Felder zu: ${missingFields.map(f => f.label).join(', ')}`);
            return;
        }

        if (!defaultLocation.type) {
            alert('Bitte wählen Sie einen Standard-Ort für die Zähler');
            return;
        }

        setImporting(true);
        try {
            const metersToCreate = csvData.map(row => {
                const meter = {
                    building_id: building.id,
                    location_type: defaultLocation.type,
                    gebaeude_index: defaultLocation.type === 'gebaeude' ? defaultLocation.index : null,
                    unit_index: defaultLocation.type === 'unit' ? defaultLocation.index : null,
                };

                // Map fields
                METER_FIELDS.forEach(field => {
                    const csvColumn = fieldMapping[field.key];
                    if (csvColumn && row[csvColumn]) {
                        meter[field.key] = row[csvColumn];
                    }
                });

                return meter;
            });

            await onImport(metersToCreate);
            setImportResult({ success: true, count: metersToCreate.length });
            
            // Reset after 2 seconds
            setTimeout(() => {
                handleReset();
                onOpenChange(false);
            }, 2000);
        } catch (error) {
            setImportResult({ success: false, error: error.message });
        } finally {
            setImporting(false);
        }
    };

    const handleReset = () => {
        setCsvData(null);
        setCsvColumns([]);
        setFieldMapping({});
        setDefaultLocation({ type: null, index: null });
        setImportResult(null);
    };

    const getMappedPreview = () => {
        if (!csvData || csvData.length === 0) return [];
        return csvData.slice(0, 5).map(row => {
            const preview = {};
            METER_FIELDS.forEach(field => {
                const csvColumn = fieldMapping[field.key];
                preview[field.label] = csvColumn ? row[csvColumn] : '-';
            });
            return preview;
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Zähler importieren (CSV)</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {!csvData ? (
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
                            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">CSV-Datei hochladen</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Wählen Sie eine CSV-Datei mit Zählerdaten
                            </p>
                            <label htmlFor="csv-upload" className="cursor-pointer">
                                <Button asChild>
                                    <span>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Datei auswählen
                                    </span>
                                </Button>
                                <input
                                    id="csv-upload"
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-slate-800">{csvData.length} Zeilen geladen</h3>
                                    <p className="text-sm text-slate-500">{csvColumns.length} Spalten erkannt</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleReset}>
                                    Neue Datei
                                </Button>
                            </div>

                            <Card className="p-4">
                                <h4 className="font-semibold text-slate-800 mb-4">Spalten zuordnen</h4>
                                <div className="space-y-3">
                                    {METER_FIELDS.map(field => (
                                        <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
                                            <Label>
                                                {field.label} {field.required && <span className="text-red-500">*</span>}
                                            </Label>
                                            <Select
                                                value={fieldMapping[field.key] || ''}
                                                onValueChange={(value) => setFieldMapping({ ...fieldMapping, [field.key]: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="CSV-Spalte wählen" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {csvColumns.map(col => (
                                                        <SelectItem key={col} value={col}>{col}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card className="p-4">
                                <h4 className="font-semibold text-slate-800 mb-4">Standard-Ort für alle Zähler</h4>
                                <LocationTreeSelect 
                                    building={building}
                                    value={defaultLocation}
                                    onChange={setDefaultLocation}
                                />
                            </Card>

                            {getMappedPreview().length > 0 && (
                                <Card className="p-4">
                                    <h4 className="font-semibold text-slate-800 mb-4">Vorschau (erste 5 Zeilen)</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    {METER_FIELDS.map(field => (
                                                        <th key={field.key} className="text-left py-2 px-3 font-medium text-slate-600">
                                                            {field.label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {getMappedPreview().map((row, idx) => (
                                                    <tr key={idx} className="border-b border-slate-100">
                                                        {METER_FIELDS.map(field => (
                                                            <td key={field.key} className="py-2 px-3 text-slate-700">
                                                                {row[field.label]}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            )}

                            {importResult && (
                                <Card className={`p-4 ${importResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <div className="flex items-center gap-3">
                                        {importResult.success ? (
                                            <>
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                <span className="text-green-800 font-medium">
                                                    {importResult.count} Zähler erfolgreich importiert!
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-5 h-5 text-red-600" />
                                                <span className="text-red-800">
                                                    Fehler: {importResult.error}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </Card>
                            )}
                        </>
                    )}

                    {csvData && !importResult && (
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Abbrechen
                            </Button>
                            <Button 
                                onClick={handleImport}
                                disabled={importing}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {csvData.length} Zähler importieren
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}