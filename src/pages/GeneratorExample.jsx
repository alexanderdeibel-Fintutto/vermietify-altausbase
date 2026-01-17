import React, { useState } from 'react';
import { VfGenerator } from '@/components/workflows/VfGenerator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function GeneratorExample() {
  const [formData, setFormData] = useState({
    landlord: '',
    tenant: '',
    address: '',
    rent: '',
    date: ''
  });
  const [preview, setPreview] = useState('');

  const handleGenerate = () => {
    const generated = `
Mieterhöhung

Sehr geehrte/r ${formData.tenant},

hiermit kündigen wir gemäß § 558 BGB eine Mieterhöhung für die Wohnung 
in ${formData.address} an.

Die neue Kaltmiete beträgt ab dem ${formData.date}: ${formData.rent} €

Mit freundlichen Grüßen,
${formData.landlord}
    `.trim();
    
    setPreview(generated);
  };

  React.useEffect(() => {
    if (formData.landlord && formData.tenant && formData.rent) {
      handleGenerate();
    }
  }, [formData]);

  return (
    <div className="max-w-7xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">Mieterhöhungs-Generator</h1>
      
      <VfGenerator
        form={
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Formular ausfüllen</h2>
            <div>
              <Label required>Vermieter</Label>
              <Input
                value={formData.landlord}
                onChange={(e) => setFormData({ ...formData, landlord: e.target.value })}
                placeholder="Max Mustermann"
              />
            </div>
            <div>
              <Label required>Mieter</Label>
              <Input
                value={formData.tenant}
                onChange={(e) => setFormData({ ...formData, tenant: e.target.value })}
                placeholder="Anna Schmidt"
              />
            </div>
            <div>
              <Label required>Adresse</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Musterstraße 42, 12345 Musterstadt"
              />
            </div>
            <div>
              <Label required>Neue Kaltmiete</Label>
              <Input
                type="number"
                value={formData.rent}
                onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                placeholder="950"
              />
            </div>
            <div>
              <Label required>Datum der Erhöhung</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <Button 
              variant="gradient" 
              className="w-full"
              onClick={handleGenerate}
            >
              Dokument generieren
            </Button>
          </div>
        }
        preview={preview}
        onDownload={() => {
          const blob = new Blob([preview], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'mieterhoehung.txt';
          a.click();
        }}
      />
    </div>
  );
}