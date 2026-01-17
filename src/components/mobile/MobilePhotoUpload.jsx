import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';

export default function MobilePhotoUpload({ onUpload, multiple = false }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  return (
    <div className="flex gap-2">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => onUpload(e.target.files)}
        className="hidden"
        multiple={multiple}
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => onUpload(e.target.files)}
        className="hidden"
        multiple={multiple}
      />

      <Button 
        variant="outline"
        onClick={() => cameraInputRef.current?.click()}
        className="flex-1"
      >
        <Camera className="h-4 w-4 mr-2" />
        Foto aufnehmen
      </Button>

      <Button 
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="flex-1"
      >
        <Upload className="h-4 w-4 mr-2" />
        Hochladen
      </Button>
    </div>
  );
}