import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image, Upload } from 'lucide-react';

export default function BuildingPhotoGallery({ buildingId }) {
  const photos = [
    { id: 1, url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400', caption: 'Außenansicht' },
    { id: 2, url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400', caption: 'Eingang' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Fotos
          <Button variant="outline" size="sm" className="ml-auto">
            <Upload className="h-4 w-4 mr-2" />
            Hochladen
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img 
                src={photo.url} 
                alt={photo.caption}
                className="w-full h-32 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">{photo.caption}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}