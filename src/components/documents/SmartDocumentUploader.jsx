import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader, CheckCircle, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_LABELS = {
    invoice: '📄 Rechnung',
    lease_contract: '🏠 Mietvertrag',
    employment_contract: '💼 Arbeitsvertrag',
    service_contract: '🤝 Servicevertrag',
    operating_cost_statement: '💰 Betriebskostenabrechnung',
    insurance_policy: '🛡️ Versicherungspolice',
    energy_certificate: '⚡ Energieausweis',
    maintenance_report: '🔧 Wartungsbericht',
    tax_document: '📊 Steuerdokument',
    letter: '✉️ Brief',
    other: '📋 Sonstiges'
};

export default function SmartDocumentUploader({ onProcessingComplete }) {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileSelect = (file) => {
        if (!file) return;

        if (file.size > 15 * 1024 * 1024) {
            toast.error('Datei zu groß (max. 15 MB)');
            return;
        }

        setSelectedFile(file);
        setResult(null);
    };

    const handleUploadAndProcess = async () => {
        if (!selectedFile) {
            toast.error('Bitte wählen Sie eine Datei');
            return;
        }

        setProcessing(true);

        try {
            // Upload
            toast.info('Datei wird hochgeladen...');
            const { file_url } = await base44.integrations.Core.UploadFile({
                file: selectedFile
            });

            // Classify and Link
            toast.info('KI klassifiziert Dokument...');
            const { classification_id } = await base44.functions.invoke('classifyAndLinkDocument', {
                document_name: selectedFile.name,
                file_url
            });

            // Poll for completion
            let attempts = 0;
            const pollInterval = setInterval(async () => {
                attempts++;
                const data = await base44.entities.SmartDocumentClassification.list(undefined, 1, { id: classification_id });
                
                if (data && data.length > 0) {
                    const classification = data[0];
                    
                    if (classification.processing_status === 'completed') {
                        clearInterval(pollInterval);
                        setResult(classification);
                        setProcessing(false);
                        toast.success('Verarbeitung abgeschlossen!');
                        
                        if (onProcessingComplete) {
                            onProcessingComplete(classification);
                        }
                    } else if (classification.processing_status === 'failed') {
                        clearInterval(pollInterval);
                        setProcessing(false);
                        toast.error('Verarbeitung fehlgeschlagen');
                    }
                }

                if (attempts > 40) {
                    clearInterval(pollInterval);
                    setProcessing(false);
                    toast.error('Timeout');
                }
            }, 1000);

        } catch (error) {
            toast.error(`Fehler: ${error.message}`);
            setProcessing(false);
        }
    };

    const handleConfirmLink = async (entityType, entityId) => {
        try {
            const updateData = {};
            if (entityType === 'Building') updateData.building_id = entityId;
            if (entityType === 'Tenant') updateData.tenant_id = entityId;
            if (entityType === 'Unit') updateData.unit_id = entityId;
            if (entityType === 'Supplier') updateData.supplier_id = entityId;

            const currentLinks = result.linked_entities || [];
            updateData.linked_entities = [
                ...currentLinks,
                {
                    entity_type: entityType,
                    entity_id: entityId,
                    linked_at: new Date().toISOString(),
                    linked_by: 'manual'
                }
            ];

            await base44.entities.SmartDocumentClassification.update(result.id, updateData);
            
            setResult({ ...result, ...updateData });
            toast.success('Verknüpfung bestätigt');
        } catch (error) {
            toast.error('Fehler beim Verknüpfen');
        }
    };

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Intelligenter Dokument-Upload
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={(e) => handleFileSelect(e.target.files[0])}
                            className="hidden"
                            accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.txt"
                        />
                        
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                                selectedFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {selectedFile ? (
                                <div>
                                    <FileText className="w-10 h-10 text-green-600 mx-auto mb-2" />
                                    <p className="font-medium text-green-700">{selectedFile.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                    <p className="font-semibold text-gray-700">Dokument hochladen</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        KI klassifiziert automatisch und verknüpft mit Entities
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">PDF, DOCX, Bilder (max. 15 MB)</p>
                                </>
                            )}
                        </div>

                        <Button
                            onClick={handleUploadAndProcess}
                            disabled={!selectedFile || processing}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            {processing ? (
                                <>
                                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                                    Verarbeitet...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Hochladen und verarbeiten
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {result && (
                <div className="space-y-4">
                    {/* Classification */}
                    <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                Klassifizierung
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-green-900">
                                        {TYPE_LABELS[result.detected_type]}
                                    </p>
                                    <p className="text-xs text-green-700 mt-1">
                                        Vertrauenswert: {result.classification_confidence}%
                                    </p>
                                </div>
                                <Badge className="bg-green-600 text-white">
                                    Erkannt
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Extracted Data */}
                    {result.extracted_fields && Object.keys(result.extracted_fields).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Extrahierte Daten</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {Object.entries(result.extracted_fields).map(([key, value]) => {
                                        if (!value || typeof value === 'object') return null;
                                        return (
                                            <div key={key} className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500 capitalize">
                                                    {key.replace(/_/g, ' ')}
                                                </p>
                                                <p className="font-medium text-sm mt-1">
                                                    {typeof value === 'number' ? value.toLocaleString('de-DE') : value}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Suggested Entity Links */}
                    {result.suggested_entity_links && result.suggested_entity_links.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <LinkIcon className="w-5 h-5" />
                                    Vorgeschlagene Verknüpfungen
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {result.suggested_entity_links.map((link, i) => {
                                        const isLinked = result.linked_entities?.some(
                                            l => l.entity_type === link.entity_type && l.entity_id === link.entity_id
                                        );

                                        return (
                                            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline">{link.entity_type}</Badge>
                                                        <span className="font-medium text-sm">{link.entity_name}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-1">{link.match_reason}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={
                                                        link.confidence >= 85 ? 'bg-green-100 text-green-800' :
                                                        link.confidence >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }>
                                                        {link.confidence}%
                                                    </Badge>
                                                    {isLinked ? (
                                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleConfirmLink(link.entity_type, link.entity_id)}
                                                        >
                                                            Verknüpfen
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {result.auto_linked && (
                                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-sm text-green-800">
                                            ✓ Dokument wurde automatisch mit {result.linked_entities?.length} Entitie(s) verknüpft
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}