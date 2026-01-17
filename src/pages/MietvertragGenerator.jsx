import React, { useState } from 'react';
import { VfGenerator } from '@/components/workflows/VfGenerator';
import { VfToolHeader } from '@/components/lead-capture/VfToolHeader';
import { VfLeadCapturePage } from '@/components/lead-capture/VfLeadCapturePage';
import { VfCalculatorInputGroup } from '@/components/calculators/VfCalculatorInputGroup';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { FileText, Download } from 'lucide-react';

export default function MietvertragGenerator() {
  const [formData, setFormData] = useState({
    landlord: '',
    tenant: '',
    address: '',
    rent: '',
    deposit: '',
    contract_start: ''
  });

  const [preview, setPreview] = useState('');

  const generateMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('generatePdf', {
      document_type: 'mietvertrag',
      data
    })
  });

  const handleGenerate = () => {
    const previewText = `
MIETVERTRAG

Vermieter: ${formData.landlord}
Mieter: ${formData.tenant}

Mietobjekt: ${formData.address}
Kaltmiete: ${formData.rent} €/Monat
Kaution: ${formData.deposit} €

Vertragsbeginn: ${formData.contract_start}

[Weitere Vertragsklauseln folgen...]
    `;
    setPreview(previewText);
  };

  const handleDownload = () => {
    generateMutation.mutate(formData);
  };

  return (
    <VfLeadCapturePage
      header={
        <VfToolHeader
          icon={<FileText className="h-10 w-10" />}
          badge="GENERATOR"
          title="Mietvertrag-Generator"
          description="Erstellen Sie einen rechtssicheren Mietvertrag in Minuten"
        />
      }
    >
      <VfGenerator
        form={
          <>
            <VfCalculatorInputGroup title="Vertragsparteien">
              <div>
                <Label>Vermieter</Label>
                <Input
                  value={formData.landlord}
                  onChange={(e) => setFormData({ ...formData, landlord: e.target.value })}
                  placeholder="Max Mustermann"
                />
              </div>
              <div>
                <Label>Mieter</Label>
                <Input
                  value={formData.tenant}
                  onChange={(e) => setFormData({ ...formData, tenant: e.target.value })}
                  placeholder="Erika Musterfrau"
                />
              </div>
            </VfCalculatorInputGroup>

            <VfCalculatorInputGroup title="Mietobjekt">
              <div>
                <Label>Adresse</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Musterstraße 42, 12345 Musterstadt"
                />
              </div>
            </VfCalculatorInputGroup>

            <VfCalculatorInputGroup title="Konditionen">
              <div>
                <Label>Kaltmiete (€/Monat)</Label>
                <Input
                  type="number"
                  value={formData.rent}
                  onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                  placeholder="850"
                />
              </div>
              <div>
                <Label>Kaution (€)</Label>
                <Input
                  type="number"
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                  placeholder="2550"
                />
              </div>
              <div>
                <Label>Vertragsbeginn</Label>
                <Input
                  type="date"
                  value={formData.contract_start}
                  onChange={(e) => setFormData({ ...formData, contract_start: e.target.value })}
                />
              </div>
            </VfCalculatorInputGroup>

            <Button 
              variant="gradient" 
              className="w-full"
              onClick={handleGenerate}
            >
              Vorschau generieren
            </Button>
          </>
        }
        preview={
          preview ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Vorschau</h3>
                <Button 
                  variant="primary" 
                  onClick={handleDownload}
                  disabled={generateMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {generateMutation.isPending ? 'Wird erstellt...' : 'PDF herunterladen'}
                </Button>
              </div>
              <div className="vf-generator-preview-content whitespace-pre-wrap">
                {preview}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--theme-text-muted)]">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Füllen Sie das Formular aus, um eine Vorschau zu sehen</p>
            </div>
          )
        }
      />
    </VfLeadCapturePage>
  );
}