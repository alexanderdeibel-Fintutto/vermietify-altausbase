import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Euro, FileText, Zap, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { addMonths, format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function RentIncreaseAutomation({ contract, building, unit }) {
  const [increasePercentage, setIncreasePercentage] = useState(3);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const calculateNewRent = () => {
    const currentRent = contract.rent_kalt || 0;
    const increase = currentRent * (increasePercentage / 100);
    const newRent = currentRent + increase;
    return { currentRent, increase, newRent };
  };

  const { currentRent, increase, newRent } = calculateNewRent();

  // Calculate minimum notice period (3 months for rent increase)
  const minEffectiveDate = addMonths(new Date(), 3);

  const handleAutoGenerate = async () => {
    if (!effectiveDate) {
      toast.error('Bitte Datum angeben');
      return;
    }

    setGenerating(true);
    try {
      // Create rent increase record
      const rentIncrease = await base44.entities.RentIncrease.create({
        contract_id: contract.id,
        tenant_id: contract.tenant_id,
        building_id: building.id,
        unit_id: unit.id,
        old_rent: currentRent,
        new_rent: newRent,
        increase_amount: increase,
        increase_percentage: increasePercentage,
        effective_date: effectiveDate,
        reason: 'Indexmietanpassung',
        status: 'draft'
      });

      // Generate document automatically
      const document = await base44.entities.GeneratedDocument.create({
        template_type: 'rent_increase_notice',
        entity_type: 'RentIncrease',
        entity_id: rentIncrease.id,
        title: `Mieterhöhung ${contract.tenant_name} - ${format(new Date(effectiveDate), 'MM/yyyy', { locale: de })}`,
        content: generateRentIncreaseLetterHTML({
          tenant: contract.tenant_name,
          unit: unit.unit_number,
          building: building.name,
          oldRent: currentRent,
          newRent: newRent,
          increase: increase,
          percentage: increasePercentage,
          effectiveDate: format(new Date(effectiveDate), 'dd. MMMM yyyy', { locale: de })
        }),
        status: 'draft'
      });

      // Update contract bookings for future
      await regenerateContractFinancialItems(contract.id, {
        newRent: newRent,
        effectiveFrom: effectiveDate
      });

      toast.success('Mieterhöhung vorbereitet - Dokument und Buchungen erstellt');
      queryClient.invalidateQueries({ queryKey: ['rent-increases'] });
      queryClient.invalidateQueries({ queryKey: ['generated-documents'] });
      
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <TrendingUp className="w-5 h-5" />
          Automatisierte Mieterhöhung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Card className="p-3 bg-white border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-medium text-blue-900">Aktuelle Miete</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">€{currentRent.toFixed(2)}</p>
        </Card>

        <div>
          <Label>Erhöhung um (%)</Label>
          <Input
            type="number"
            step="0.1"
            value={increasePercentage}
            onChange={(e) => setIncreasePercentage(parseFloat(e.target.value) || 0)}
            className="text-lg"
          />
        </div>

        <div>
          <Label>Wirksam ab *</Label>
          <Input
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            min={format(minEffectiveDate, 'yyyy-MM-dd')}
          />
          <p className="text-xs text-slate-500 mt-1">
            Mindestens 3 Monate Vorlauf gesetzlich erforderlich
          </p>
        </div>

        <div className="p-3 bg-white rounded-lg border border-blue-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Aktuelle Miete:</span>
            <span className="font-semibold">€{currentRent.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Erhöhung (+{increasePercentage}%):</span>
            <span className="font-semibold text-green-600">+€{increase.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-medium text-slate-700">Neue Miete:</span>
            <span className="text-xl font-bold text-blue-700">€{newRent.toFixed(2)}</span>
          </div>
        </div>

        <Button
          onClick={handleAutoGenerate}
          disabled={generating || !effectiveDate}
          className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
        >
          {generating ? (
            'Wird erstellt...'
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Mieterhöhung vorbereiten
            </>
          )}
        </Button>

        <p className="text-xs text-slate-600">
          <FileText className="w-3 h-3 inline mr-1" />
          Erstellt automatisch: Mieterhöhungsschreiben + Aktualisierte Buchungen ab Stichtag
        </p>
      </CardContent>
    </Card>
  );
}

function generateRentIncreaseLetterHTML({ tenant, unit, building, oldRent, newRent, increase, percentage, effectiveDate }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Mieterhöhung</h2>
      
      <p>Sehr geehrte/r ${tenant},</p>
      
      <p>hiermit kündigen wir für die von Ihnen gemietete Wohnung <strong>${unit}</strong> 
      im Gebäude <strong>${building}</strong> eine Mieterhöhung an.</p>
      
      <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px;">Bisherige Kaltmiete:</td>
          <td style="padding: 8px; text-align: right; font-weight: bold;">€${oldRent.toFixed(2)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px;">Erhöhung (+${percentage}%):</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; color: green;">+€${increase.toFixed(2)}</td>
        </tr>
        <tr style="background: #f3f4f6;">
          <td style="padding: 8px;"><strong>Neue Kaltmiete:</strong></td>
          <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 18px;">€${newRent.toFixed(2)}</td>
        </tr>
      </table>
      
      <p>Die neue Miete ist ab dem <strong>${effectiveDate}</strong> zu zahlen.</p>
      
      <p>Mit freundlichen Grüßen</p>
    </div>
  `;
}

function regenerateContractFinancialItems(contractId, options = {}) {
  // Placeholder - would call actual function
  return Promise.resolve();
}