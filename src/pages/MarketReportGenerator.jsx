import React, { useState } from 'react';
import { VfGenerator } from '@/components/workflows/VfGenerator';
import { VfToolHeader } from '@/components/lead-capture/VfToolHeader';
import { VfLeadCapturePage } from '@/components/lead-capture/VfLeadCapturePage';
import { VfCalculatorInputGroup } from '@/components/calculators/VfCalculatorInputGroup';
import { VfSelect } from '@/components/shared/VfSelect';
import { Button } from '@/components/ui/button';
import { BarChart3, Download } from 'lucide-react';

export default function MarketReportGenerator() {
  const [formData, setFormData] = useState({
    city: '',
    property_type: 'wohnung',
    size: '60-80'
  });

  const [preview, setPreview] = useState('');

  const handleGenerate = () => {
    const previewText = `
MARKTREPORT - ${formData.city.toUpperCase()}

Immobilienart: ${formData.property_type}
Größe: ${formData.size} m²

DURCHSCHNITTLICHE KAUFPREISE
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ø Kaufpreis:     ${formData.city === 'Berlin' ? '4.800' : '3.200'} €/m²
Ø Gesamtpreis:   ${formData.city === 'Berlin' ? '336.000' : '224.000'} €

MIETPREISE
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ø Kaltmiete:     ${formData.city === 'Berlin' ? '14,50' : '11,20'} €/m²
Ø Monatlich:     ${formData.city === 'Berlin' ? '1.015' : '784'} €

RENDITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Brutto-Rendite:  ${formData.city === 'Berlin' ? '3,6%' : '4,2%'}

MARKTENTWICKLUNG
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Preisentwicklung 2025: +2,3%
Nachfrage: Hoch
Leerstandsquote: 1,8%

Stand: Januar 2026
Quelle: Immobilienscout24, Statistisches Bundesamt
    `;
    setPreview(previewText);
  };

  return (
    <VfLeadCapturePage
      header={
        <VfToolHeader
          icon={<BarChart3 className="h-10 w-10" />}
          badge="KOSTENLOS"
          title="Marktreport-Generator"
          description="Erhalten Sie aktuelle Marktdaten für Ihre Region"
        />
      }
    >
      <VfGenerator
        form={
          <>
            <VfCalculatorInputGroup title="Standort & Immobilie">
              <VfSelect
                label="Stadt"
                value={formData.city}
                onChange={(v) => setFormData({ ...formData, city: v })}
                options={[
                  { value: 'Berlin', label: 'Berlin' },
                  { value: 'Hamburg', label: 'Hamburg' },
                  { value: 'München', label: 'München' },
                  { value: 'Köln', label: 'Köln' },
                  { value: 'Frankfurt', label: 'Frankfurt' }
                ]}
                placeholder="Stadt auswählen"
              />
              
              <VfSelect
                label="Immobilienart"
                value={formData.property_type}
                onChange={(v) => setFormData({ ...formData, property_type: v })}
                options={[
                  { value: 'wohnung', label: 'Wohnung' },
                  { value: 'haus', label: 'Haus' },
                  { value: 'gewerbe', label: 'Gewerbe' }
                ]}
              />
              
              <VfSelect
                label="Größe"
                value={formData.size}
                onChange={(v) => setFormData({ ...formData, size: v })}
                options={[
                  { value: '0-40', label: '0-40 m²' },
                  { value: '40-60', label: '40-60 m²' },
                  { value: '60-80', label: '60-80 m²' },
                  { value: '80-100', label: '80-100 m²' },
                  { value: '100+', label: 'über 100 m²' }
                ]}
              />
            </VfCalculatorInputGroup>

            <Button 
              variant="gradient" 
              className="w-full"
              onClick={handleGenerate}
              disabled={!formData.city}
            >
              Marktreport generieren
            </Button>
          </>
        }
        preview={
          preview ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Marktreport</h3>
                <Button variant="primary">
                  <Download className="h-4 w-4 mr-2" />
                  PDF herunterladen
                </Button>
              </div>
              <div className="vf-generator-preview-content whitespace-pre-wrap font-mono text-xs">
                {preview}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--theme-text-muted)]">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Wählen Sie Stadt und Immobilienart</p>
            </div>
          )
        }
      />
    </VfLeadCapturePage>
  );
}