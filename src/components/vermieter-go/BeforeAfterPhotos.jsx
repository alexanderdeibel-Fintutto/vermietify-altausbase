import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import MobilePhotoUpload from '@/components/mobile/MobilePhotoUpload';

export default function BeforeAfterPhotos({ taskId }) {
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vorher/Nachher-Vergleich</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Badge className="mb-2">Vorher</Badge>
            {beforePhoto ? (
              <img src={beforePhoto} alt="Vorher" className="w-full aspect-square object-cover rounded-lg" />
            ) : (
              <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center">
                <MobilePhotoUpload
                  onUploadComplete={(urls) => setBeforePhoto(urls[0])}
                  maxFiles={1}
                />
              </div>
            )}
          </div>
          <div>
            <Badge className="mb-2">Nachher</Badge>
            {afterPhoto ? (
              <img src={afterPhoto} alt="Nachher" className="w-full aspect-square object-cover rounded-lg" />
            ) : (
              <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center">
                <MobilePhotoUpload
                  onUploadComplete={(urls) => setAfterPhoto(urls[0])}
                  maxFiles={1}
                />
              </div>
            )}
          </div>
        </div>

        {beforePhoto && afterPhoto && (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600">
            <ArrowRight className="w-4 h-4" />
            <span className="font-semibold">Vergleich komplett</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}