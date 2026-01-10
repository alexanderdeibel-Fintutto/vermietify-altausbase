import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();

  const handleScan = async () => {
    try {
      // Use file input as fallback for QR scanning
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          // In real implementation, use QR scanner library
          toast.success('QR-Code wird verarbeitet...');
          // Navigate to scanned entity
          // Example: navigate(createPageUrl('MeterDashboard'));
        }
      };
      
      input.click();
    } catch (error) {
      toast.error('Scanner-Fehler');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="w-4 h-4" />
          QR-Scanner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleScan} className="w-full h-32 bg-gradient-to-br from-purple-500 to-purple-600">
          <div className="flex flex-col items-center gap-2">
            <Camera className="w-12 h-12" />
            <span className="text-lg font-semibold">QR-Code scannen</span>
            <span className="text-xs text-purple-100">Zähler, Gebäude, Einheit</span>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}