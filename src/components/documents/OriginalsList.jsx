import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Eye, Trash2, Link as LinkIcon, Unlink } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_CONFIG = {
    verknuepft: { label: 'Verknüpft', color: 'bg-emerald-100 text-emerald-700' },
    unverknuepft: { label: 'Unverknüpft', color: 'bg-slate-100 text-slate-700' },
    zur_bearbeitung: { label: 'Zur Bearbeitung', color: 'bg-yellow-100 text-yellow-700' }
};

export default function OriginalsList() {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [selectedOriginal, setSelectedOriginal] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [uploading, setUploading] = useState(false);
    const queryClient = useQueryClient();

    const { data: originals = [], isLoading } = useQuery({
        queryKey: ['documentOriginals'],
        queryFn: () => base44.entities.DocumentOriginal.list('-created_date')
    });

    const { data: documents = [] } = useQuery({
        queryKey: ['documents'],
        queryFn: () => base44.entities.Document.list()
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.DocumentOriginal.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documentOriginals'] });
            toast.success('Datei erfolgreich hochgeladen');
            setUploadDialogOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.DocumentOriginal.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documentOriginals'] });
            toast.success('Verknüpfung aktualisiert');
            setLinkDialogOpen(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.DocumentOriginal.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentOriginals'] })
    });

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        for (const file of files) {
            try {
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                
                let metadata = null;
                // PDF-Metadaten extrahieren
                if (file.type === 'application/pdf') {
                    try {
                        const metadataResponse = await base44.functions.invoke('extractPDFMetadata', {
                            pdf_url: file_url
                        });
                        metadata = metadataResponse.data?.metadata;
                    } catch (error) {
                        console.error('Metadata extraction failed:', error);
                    }
                }
                
                await createMutation.mutateAsync({
                    file_url,
                    file_name: file.name,
                    file_size: file.size,
                    file_type: file.type.includes('pdf') ? 'PDF' : file.type.includes('image') ? 'JPG/PNG' : 'Sonstiges',
                    status: 'unverknuepft',
                    pages: metadata?.pages || null,
                    metadata: metadata || null
                });
            } catch (error) {
                toast.error(`Fehler beim Upload von ${file.name}`);
            }
        }
        setUploading(false);
    };

    const handleLink = (original) => {
        setSelectedOriginal(original);
        setLinkDialogOpen(true);
    };

    const filteredOriginals = filterStatus === 'all' 
        ? originals 
        : originals.filter(o => o.status === filterStatus);

    if (isLoading) {
        return <div className="text-center py-12 text-slate-500">Lädt...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Originale</h2>
                    <p className="text-sm text-slate-600">Gescannte und hochgeladene Originaldokumente</p>
                </div>
                <label>
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                        <span>
                            <Upload className="w-4 h-4 mr-2" />
                            {uploading ? 'Lädt hoch...' : 'Dateien hochladen'}
                        </span>
                    </Button>
                </label>
            </div>

            <div className="flex gap-2 flex-wrap">
                <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                >
                    Alle ({originals.length})
                </Button>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                    const count = originals.filter(o => o.status === key).length;
                    return (
                        <Button
                            key={key}
                            variant={filterStatus === key ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus(key)}
                        >
                            {config.label} ({count})
                        </Button>
                    );
                })}
            </div>

            <div className="grid gap-4">
                {filteredOriginals.map((original) => {
                    const statusConfig = STATUS_CONFIG[original.status];
                    const linkedDoc = documents.find(d => d.id === original.document_id);

                    return (
                        <Card key={original.id} className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-5 h-5 text-emerald-600" />
                                        <h3 className="font-semibold text-slate-800">{original.file_name}</h3>
                                        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                                        <Badge variant="outline">{original.file_type}</Badge>
                                    </div>

                                    {linkedDoc && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                                            <LinkIcon className="w-4 h-4" />
                                            <span>Verknüpft mit: {linkedDoc.name}</span>
                                        </div>
                                    )}

                                    <div className="flex gap-4 text-xs text-slate-500 mt-2">
                                        <span>Hochgeladen: {format(new Date(original.created_date), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
                                        <span>Größe: {(original.file_size / 1024).toFixed(0)} KB</span>
                                    </div>
                                </div>

                                <div className="flex gap-1 ml-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => window.open(original.file_url, '_blank')}
                                        title="Ansehen"
                                    >
                                        <Eye className="w-4 h-4 text-slate-600" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleLink(original)}
                                        title="Verknüpfen"
                                    >
                                        <LinkIcon className="w-4 h-4 text-emerald-600" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            if (confirm('Original wirklich löschen?')) {
                                                deleteMutation.mutate(original.id);
                                            }
                                        }}
                                        title="Löschen"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {filteredOriginals.length === 0 && (
                    <Card className="p-12 text-center">
                        <Upload className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Keine Originale</h3>
                        <p className="text-slate-600 mb-6">Laden Sie gescannte Dokumente hoch</p>
                        <label>
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                                <span>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Erste Datei hochladen
                                </span>
                            </Button>
                        </label>
                    </Card>
                )}
            </div>

            {/* Link Dialog */}
            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Original verknüpfen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Mit Dokument verknüpfen</Label>
                            <Select
                                value={selectedOriginal?.document_id || ''}
                                onValueChange={(value) => {
                                    updateMutation.mutate({
                                        id: selectedOriginal.id,
                                        data: {
                                            document_id: value || null,
                                            status: value ? 'verknuepft' : 'unverknuepft'
                                        }
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Dokument auswählen" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={null}>-- Verknüpfung entfernen --</SelectItem>
                                    {documents.map(doc => (
                                        <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}