import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Barcode, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function BarcodeScanner() {
  const handleScan = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        toast.success('Barcode wird verarbeitet...');
        // Barcode scanning logic
      }
    };
    
    input.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Barcode className="w-4 h-4" />
          Barcode-Scanner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleScan} className="w-full h-20 bg-indigo-600">
          <div className="flex flex-col items-center gap-2">
            <Barcode className="w-8 h-8" />
            <span>Barcode scannen</span>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}