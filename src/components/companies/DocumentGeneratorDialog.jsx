import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Download, Eye } from 'lucide-react';

export default function DocumentGeneratorDialog({ isOpen, onClose, template, companyData, companyId }) {
  const [formData, setFormData] = useState({});
  const [generatedUrl, setGeneratedUrl] = useState(null);

  useEffect(() => {
    if (template?.placeholders) {
      const initialData = {};
      template.placeholders.forEach(ph => {
        // Auto-fill mit Firmendaten wenn verfügbar
        if (ph.key === 'company_name') initialData[ph.key] = companyData?.name || '';
        else if (ph.key === 'address') initialData[ph.key] = companyData?.address || '';
        else if (ph.key === 'tax_id') initialData[ph.key] = companyData?.tax_id || '';
        else if (ph.key === 'registration_number') initialData[ph.key] = companyData?.registration_number || '';
        else initialData[ph.key] = '';
      });
      setFormData(initialData);
    }
  }, [template, companyData]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateDocumentFromTemplate', {
        template_id: template.id,
        company_id: companyId,
        form_data: formData
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedUrl(data.file_url);
    }
  });

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dokument generieren: {template.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {generatedUrl ? (
            // Generated Document Preview
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900">✓ Dokument erfolgreich generiert!</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(generatedUrl, '_blank')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Vorschau
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = generatedUrl;
                    a.download = `${template.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
                    a.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Herunterladen
                </Button>
              </div>
            </div>
          ) : (
            // Form for Filling Data
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Füllen Sie die erforderlichen Felder aus. Vordefinierte Felder sind bereits mit Ihren Firmendaten ausgefüllt.
              </p>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {template.placeholders?.map(placeholder => (
                  <div key={placeholder.key}>
                    <label className="text-sm font-medium text-slate-700">
                      {placeholder.label}
                      {placeholder.required && <span className="text-red-600 ml-1">*</span>}
                    </label>
                    <Input
                      type={placeholder.type || 'text'}
                      placeholder={placeholder.label}
                      value={formData[placeholder.key] || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, [placeholder.key]: e.target.value })
                      }
                      className="mt-1"
                      disabled={['company_name', 'address', 'tax_id', 'registration_number'].includes(
                        placeholder.key
                      )}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={onClose}>Abbrechen</Button>
                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="gap-2"
                >
                  {generateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Generieren
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}