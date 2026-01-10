import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wifi, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function NFCReader() {
  const handleNFCRead = async () => {
    if ('NDEFReader' in window) {
      try {
        const ndef = new NDEFReader();
        await ndef.scan();
        toast.success('NFC bereit - Tag scannen');
        
        ndef.addEventListener('reading', ({ message }) => {
          toast.success('NFC Tag erkannt');
        });
      } catch (error) {
        toast.error('NFC nicht verfügbar');
      }
    } else {
      toast.warning('NFC nicht unterstützt');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Tag className="w-4 h-4" />
          NFC-Reader
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleNFCRead} className="w-full h-20 bg-purple-600">
          <div className="flex flex-col items-center gap-2">
            <Wifi className="w-8 h-8" />
            <span>NFC Tag lesen</span>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}