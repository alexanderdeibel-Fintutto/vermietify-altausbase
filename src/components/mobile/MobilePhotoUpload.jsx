import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

export default function MobilePhotoUpload({ onCapture }) {
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onCapture) {
      onCapture(file);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
      <Button 
        variant="gradient"
        onClick={() => fileInputRef.current?.click()}
        className="w-full"
      >
        <Camera className="h-4 w-4 mr-2" />
        Foto aufnehmen
      </Button>
    </>
  );
}