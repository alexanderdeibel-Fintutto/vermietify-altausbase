import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const FORM_SCHEMAS = {
  invoice: [
    { field: 'client_name', label: 'Kunde', type: 'text', essential: true },
    { field: 'invoice_number', label: 'Rechnungsnummer', type: 'text', essential: true },
    { field: 'amount', label: 'Betrag', type: 'number', essential: true },
    { field: 'description', label: 'Beschreibung', type: 'textarea', essential: false }
  ],
  expense: [
    { field: 'amount', label: 'Betrag', type: 'number', essential: true },
    { field: 'category', label: 'Kategorie', type: 'text', essential: true },
    { field: 'vendor_name', label: 'Anbieter', type: 'text', essential: false },
    { field: 'description', label: 'Beschreibung', type: 'textarea', essential: false }
  ],
  contract: [
    { field: 'tenant_name', label: 'Mietername', type: 'text', essential: true },
    { field: 'address', label: 'Adresse', type: 'text', essential: true },
    { field: 'rent_amount', label: 'Mietbetrag', type: 'number', essential: true },
    { field: 'start_date', label: 'Startdatum', type: 'date', essential: true }
  ],
  protocol: [
    { field: 'tenant_name', label: 'Mietername', type: 'text', essential: true },
    { field: 'unit_address', label: 'Wohnungsadresse', type: 'text', essential: true },
    { field: 'condition_notes', label: 'Zustandsnotizen', type: 'textarea', essential: false }
  ],
  income: [
    { field: 'amount', label: 'Betrag', type: 'number', essential: true },
    { field: 'source', label: 'Quelle', type: 'text', essential: true },
    { field: 'description', label: 'Beschreibung', type: 'textarea', essential: false }
  ]
};

export default function VoiceFormDisplay({
  onClose,
  formType,
  allData,
  essentialData,
  confidence
}) {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(allData || {});
  const [isSaving, setIsSaving] = useState(false);

  const schema = FORM_SCHEMAS[formType] || [];

  const handleInputChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validate required fields
    const requiredFields = schema.filter(f => f.essential);
    const missingFields = requiredFields.filter(f => !formValues[f.field]);
    
    if (missingFields.length > 0) {
      toast.error(`Bitte fülle aus: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setIsSaving(true);
    try {
      // Prepare data
      const dataToSave = {};
      schema.forEach(field => {
        if (formValues[field.field]) {
          dataToSave[field.field] = formValues[field.field];
        }
      });

      // Map to appropriate entity based on form_type
      const entityMap = {
        invoice: 'Invoice',
        expense: 'FinancialItem',
        contract: 'LeaseContract',
        protocol: 'HandoverProtocol',
        income: 'FinancialItem'
      };

      const entityName = entityMap[formType];
      const result = await base44.entities[entityName].create(dataToSave);

      toast.success(`${formType} erfolgreich erstellt`);
      
      // Auto-navigate based on form type
      const navigationMap = {
        invoice: createPageUrl('Invoices'),
        expense: createPageUrl('FinancialItems'),
        contract: createPageUrl('LeaseContracts'),
        protocol: createPageUrl('HandoverProtocols'),
        income: createPageUrl('FinancialItems')
      };

      const nextPage = navigationMap[formType] || createPageUrl('Dashboard');
      setTimeout(() => {
        navigate(nextPage);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Fehler beim Speichern: ' + (error?.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="capitalize">
                {formType === 'contract' ? 'Mietvertrag' : formType}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-1">
                Erkannt mit {confidence}% Sicherheit
              </p>
            </div>
            {confidence < 70 && (
              <div className="flex gap-2 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-yellow-700">Überprüfen</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {schema.map(field => (
            <div key={field.field} className="space-y-1">
              <label className="text-sm font-medium">
                {field.label}
                {field.essential && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <Textarea
                  value={formValues[field.field] || ''}
                  onChange={(e) => handleInputChange(field.field, e.target.value)}
                  placeholder={field.label}
                  className="resize-none h-20"
                />
              ) : (
                <Input
                  type={field.type}
                  value={formValues[field.field] || ''}
                  onChange={(e) => handleInputChange(field.field, e.target.value)}
                  placeholder={field.label}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Speichert...' : 'Speichern'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}