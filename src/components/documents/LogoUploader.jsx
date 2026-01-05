import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X } from 'lucide-react';

export default function LogoUploader({ logoUrl, onLogoChange }) {
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            onLogoChange(file_url);
        } catch (error) {
            console.error('Logo upload error:', error);
            alert('Fehler beim Hochladen des Logos');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card className="p-4">
            {logoUrl ? (
                <div className="flex items-center justify-between">
                    <img src={logoUrl} alt="Logo" className="h-16 object-contain" />
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onLogoChange(null)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <div className="text-center">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="logo-upload"
                    />
                    <label htmlFor="logo-upload">
                        <Button asChild disabled={uploading}>
                            <span>
                                <Upload className="w-4 h-4 mr-2" />
                                {uploading ? 'Lädt...' : 'Logo hochladen'}
                            </span>
                        </Button>
                    </label>
                </div>
            )}
        </Card>
    );
}