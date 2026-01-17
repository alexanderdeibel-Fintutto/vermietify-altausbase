import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Plus } from 'lucide-react';
import OptimizedImage from '@/components/shared/OptimizedImage';

export default function BuildingPhotoGallery({ photos = [] }) {
  const defaultPhotos = [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400'
  ];

  const displayPhotos = photos.length > 0 ? photos : defaultPhotos;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Fotos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {displayPhotos.map((photo, index) => (
            <OptimizedImage
              key={index}
              src={photo}
              alt={`Objektfoto ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg"
            />
          ))}
        </div>
        <Button variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Foto hinzufügen
        </Button>
      </CardContent>
    </Card>
  );
}