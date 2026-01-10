import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Camera, Image, Grid } from 'lucide-react';
import MobilePhotoUpload from '@/components/mobile/MobilePhotoUpload';

export default function PhotoGallery({ buildingId, unitId }) {
  const [showUpload, setShowUpload] = useState(false);

  const { data: documents = [] } = useQuery({
    queryKey: ['photos', buildingId, unitId],
    queryFn: () => base44.entities.Document.filter(
      {
        ...(buildingId && { building_id: buildingId }),
        ...(unitId && { unit_id: unitId }),
        file_url: { $exists: true }
      },
      '-created_date',
      50
    )
  });

  const photos = documents.filter(d => 
    d.file_url && (d.file_url.match(/\.(jpg|jpeg|png|gif)$/i) || d.file_type === 'image')
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="w-4 h-4" />
            Foto-Galerie
          </CardTitle>
          <Button size="sm" onClick={() => setShowUpload(!showUpload)}>
            <Camera className="w-3 h-3 mr-1" />
            Foto
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showUpload && (
          <MobilePhotoUpload
            onUploadComplete={async (urls) => {
              for (const url of urls) {
                await base44.entities.Document.create({
                  name: `Foto ${new Date().toLocaleDateString('de-DE')}`,
                  file_url: url,
                  file_type: 'image',
                  category: 'Verwaltung',
                  status: 'erstellt',
                  building_id: buildingId,
                  unit_id: unitId
                });
              }
              setShowUpload(false);
            }}
            maxFiles={10}
          />
        )}

        <div className="grid grid-cols-3 gap-2">
          {photos.slice(0, 9).map(photo => (
            <div key={photo.id} className="aspect-square rounded-lg overflow-hidden border border-slate-200">
              <img
                src={photo.file_url}
                alt={photo.name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {photos.length === 0 && !showUpload && (
          <p className="text-center text-slate-600 py-8">Keine Fotos vorhanden</p>
        )}
      </CardContent>
    </Card>
  );
}