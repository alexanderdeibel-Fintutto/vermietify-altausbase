import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Loader } from 'lucide-react';
import { toast } from 'sonner';

const CONTRACT_TYPES = [
    { value: 'lease', label: 'Mietvertrag' },
    { value: 'employment', label: 'Arbeitsvertrag' },
    { value: 'service', label: 'Servicevertrag' },
    { value: 'purchase', label: 'Kaufvertrag' },
    { value: 'partnership', label: 'Partnerschaftsvertrag' },
    { value: 'other', label: 'Sonstiges' }
];

export default function ContractUploadForm({ onUploadComplete, building_id, related_entity_id, related_entity_type }) {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [contractType, setContractType] = useState('other');

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const processFile = async (file) => {
        if (!file) return;

        // Validate file size (10 MB max)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Datei zu groß (max. 10 MB)');
            return;
        }

        const validTypes = ['application/pdf', 'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          'image/jpeg', 'image/png', 'image/gif', 'text/plain'];

        if (!validTypes.includes(file.type)) {
            toast.error('Format nicht unterstützt. Erlaubt: PDF, DOCX, Bilder, TXT');
            return;
        }

        setSelectedFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Bitte wählen Sie eine Datei');
            return;
        }

        if (!contractType) {
            toast.error('Bitte wählen Sie einen Vertragstyp');
            return;
        }

        setUploading(true);

        try {
            // Upload file
            const { file_url } = await base44.integrations.Core.UploadFile({
                file: selectedFile
            });

            // Determine file format
            let fileFormat = 'pdf';
            if (selectedFile.type.includes('word') || selectedFile.name.endsWith('.docx')) fileFormat = 'docx';
            else if (selectedFile.type.includes('image') || selectedFile.name.match(/\.(jpg|jpeg|png|gif)$/i)) fileFormat = 'image';
            else if (selectedFile.type === 'text/plain') fileFormat = 'txt';

            // Start analysis
            const { analysis_id } = await base44.functions.invoke('analyzeContractDocument', {
                document_name: selectedFile.name,
                contract_type: contractType,
                file_url,
                file_format: fileFormat,
                building_id,
                related_entity_id,
                related_entity_type
            });

            toast.success('Dokument hochgeladen - Analyse läuft...');
            setSelectedFile(null);
            setContractType('other');
            
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            if (onUploadComplete) {
                onUploadComplete(analysis_id);
            }
        } catch (error) {
            toast.error(`Fehler: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Vertrag hochladen
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Drag and Drop Area */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition ${
                            dragActive ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
                        } ${selectedFile ? 'bg-green-50 border-green-300' : ''}`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.gif,.txt"
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center gap-2 cursor-pointer"
                        >
                            <Upload className="w-10 h-10 text-gray-400" />
                            <div>
                                <p className="font-semibold text-gray-700">Datei hierher ziehen oder klicken</p>
                                <p className="text-sm text-gray-500 mt-1">PDF, DOCX, Bilder (max. 10 MB)</p>
                            </div>
                        </button>

                        {selectedFile && (
                            <div className="mt-4 p-3 bg-white rounded border border-green-300">
                                <p className="text-sm font-medium text-green-700">✓ {selectedFile.name}</p>
                                <p className="text-xs text-gray-500">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Contract Type Selection */}
                    {selectedFile && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Vertragstyp *
                            </label>
                            <select
                                value={contractType}
                                onChange={(e) => setContractType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                {CONTRACT_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Upload Button */}
                    <Button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                        {uploading ? (
                            <>
                                <Loader className="w-4 h-4 mr-2 animate-spin" />
                                Wird hochgeladen...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Hochladen und analysieren
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}