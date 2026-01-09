import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { QrCode, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';

export default function MeterQRCodeGenerator({ buildingId }) {
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const { data: meters = [] } = useQuery({
    queryKey: ['meters', buildingId],
    queryFn: () => base44.entities.Meter.filter(
      buildingId ? { building_id: buildingId } : {},
      'location',
      200
    )
  });

  const generateQRCode = (meterId, meterNumber) => {
    // Generate QR code URL using a free service
    const data = JSON.stringify({ 
      type: 'meter',
      id: meterId,
      number: meterNumber 
    });
    const encoded = encodeURIComponent(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
  };

  const downloadPDF = async () => {
    setGeneratingPDF(true);
    try {
      const response = await base44.functions.invoke('generateMeterQRLabels', {
        meter_ids: meters.map(m => m.id)
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zaehler_qr_labels_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('QR-Labels heruntergeladen');
    } catch (error) {
      toast.error('Fehler beim Generieren');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const printLabels = () => {
    window.print();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR-Code Labels
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={downloadPDF}
              disabled={generatingPDF || meters.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={printLabels}
              disabled={meters.length === 0}
            >
              <Printer className="w-4 h-4 mr-2" />
              Drucken
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3">
          {meters.map(meter => (
            <div 
              key={meter.id} 
              className="border-2 border-dashed border-slate-300 rounded-lg p-3 text-center print:break-inside-avoid"
            >
              <img
                src={generateQRCode(meter.id, meter.meter_number)}
                alt={`QR Code ${meter.meter_number}`}
                className="w-32 h-32 mx-auto mb-2"
              />
              <p className="font-bold text-sm">{meter.meter_number}</p>
              <p className="text-xs text-slate-600 mt-1">{meter.location}</p>
              <Badge variant="outline" className="text-xs mt-2">
                {meter.meter_type}
              </Badge>
            </div>
          ))}
        </div>

        {meters.length === 0 && (
          <p className="text-center text-slate-600 py-8">
            Keine Zähler vorhanden
          </p>
        )}
      </CardContent>
    </Card>
  );
}