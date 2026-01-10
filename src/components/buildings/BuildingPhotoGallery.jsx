import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Trash2, X } from 'lucide-react';

export default function BuildingPhotoGallery({ buildingId, photos = [] }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (photoId) => {
      const building = await base44.entities.Building.filter({ id: buildingId });
      const updatedPhotos = building[0].photos.filter(p => p.id !== photoId);
      return base44.entities.Building.update(buildingId, { photos: updatedPhotos });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building', buildingId] });
    }
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedPhotos = [];
      
      for (const file of files) {
        const result = await base44.integrations.Core.UploadFile({ file });
        uploadedPhotos.push({
          id: Math.random().toString(36),
          url: result.file_url,
          uploadedAt: new Date().toISOString(),
          title: file.name
        });
      }

      const building = await base44.entities.Building.filter({ id: buildingId });
      const allPhotos = [...(building[0].photos || []), ...uploadedPhotos];
      
      await base44.entities.Building.update(buildingId, { photos: allPhotos });
      queryClient.invalidateQueries({ queryKey: ['building', buildingId] });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Gebäudefotos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <label className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-slate-400 transition-colors">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={uploading}
            className="hidden"
          />
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Fotos hochladen</p>
          <p className="text-xs text-slate-500 mt-1">oder hier klicken</p>
        </label>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map(photo => (
            <div
              key={photo.id}
              className="relative group rounded-lg overflow-hidden bg-slate-100 aspect-square cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.url}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate(photo.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {photos.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-8">Keine Fotos vorhanden</p>
        )}

        {/* Lightbox */}
        {selectedPhoto && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-2xl w-full">
              <Button
                size="icon"
                variant="ghost"
                className="absolute -top-10 right-0 text-white hover:bg-slate-700"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="w-6 h-6" />
              </Button>
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="w-full rounded-lg"
              />
              <p className="mt-4 text-white text-center">{selectedPhoto.title}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}