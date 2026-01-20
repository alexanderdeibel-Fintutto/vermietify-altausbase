import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Download, Eye, Trash2 } from 'lucide-react';
import { showSuccess, showError } from '@/components/notifications/ToastNotification';

export default function Documents() {
    const [uploading, setUploading] = useState(false);
    const queryClient = useQueryClient();

    const { data: documents = [], isLoading } = useQuery({
        queryKey: ['documents'],
        queryFn: () => base44.entities.Document.list('-created_date')
    });

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            await base44.entities.Document.create({
                title: file.name,
                file_url,
                file_type: file.type,
                file_size: file.size
            });
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            showSuccess('Dokument hochgeladen');
        } catch (error) {
            showError('Upload fehlgeschlagen');
        } finally {
            setUploading(false);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Dokumente</h1>
                    <p className="vf-page-subtitle">{documents.length} Dokumente</p>
                </div>
                <div className="vf-page-actions">
                    <label>
                        <Button className="vf-btn-gradient" disabled={uploading}>
                            <Upload className="w-4 h-4" />
                            {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
                        </Button>
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                    </label>
                </div>
            </div>

            {documents.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <FileText className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Noch keine Dokumente</h3>
                            <p className="text-gray-600 mb-6">Laden Sie Ihr erstes Dokument hoch</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                        <Card key={doc.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">{doc.title}</h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(doc.created_date).toLocaleDateString('de-DE')}
                                        </p>
                                        {doc.file_url && (
                                            <div className="flex gap-2 mt-3">
                                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="w-3 h-3" />
                                                    </Button>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}