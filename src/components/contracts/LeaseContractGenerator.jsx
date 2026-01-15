import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function LeaseContractGenerator({ tenantId, unitId, buildingId }) {
  const [step, setStep] = useState('template'); // template -> data -> preview
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [contractHtml, setContractHtml] = useState(null);
  const [formData, setFormData] = useState({
    tenant_name: '',
    tenant_email: '',
    tenant_phone: '',
    rent_amount: '',
    contract_start: new Date().toISOString().split('T')[0],
    contract_end: '',
    security_deposit: '',
    operating_cost_advance: ''
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['leaseTemplates'],
    queryFn: () => base44.entities.LeaseTemplate.list()
  });

  const handleGenerateContract = async () => {
    if (!selectedTemplate || !formData.tenant_name || !formData.rent_amount) {
      toast.error('Bitte alle erforderlichen Felder ausfüllen');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateLeaseContract', {
        templateId: selectedTemplate.id,
        tenantId,
        unitId,
        contractData: {
          ...formData,
          rent_amount: parseFloat(formData.rent_amount),
          security_deposit: parseFloat(formData.security_deposit || 0),
          operating_cost_advance: parseFloat(formData.operating_cost_advance || 0)
        }
      });

      setContractHtml(response.data.contract_html);
      setStep('preview');
      toast.success('Mietvertrag generiert');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const element = document.createElement('a');
    const file = new Blob([contractHtml], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `Mietvertrag_${formData.tenant_name.replace(/\s/g, '_')}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Vertrag heruntergeladen');
  };

  return (
    <div className="space-y-4">
      {step === 'template' && (
        <Card>
          <CardHeader>
            <CardTitle>Mietvertrag-Vorlage auswählen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.length > 0 ? (
              <div className="grid gap-2">
                {templates.filter(t => t.is_active).map(template => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setStep('data');
                    }}
                    className={`p-3 text-left rounded border-2 transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-gray-600">{template.contract_type} • {template.jurisdiction}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">Keine Templates verfügbar</p>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'data' && selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Vertragsdaten ausfüllen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name Mieter</label>
                <Input
                  value={formData.tenant_name}
                  onChange={(e) => setFormData({...formData, tenant_name: e.target.value})}
                  placeholder="Max Mustermann"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={formData.tenant_email}
                  onChange={(e) => setFormData({...formData, tenant_email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefon</label>
                <Input
                  value={formData.tenant_phone}
                  onChange={(e) => setFormData({...formData, tenant_phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Miete (€/Monat)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.rent_amount}
                  onChange={(e) => setFormData({...formData, rent_amount: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mietstart</label>
                <Input
                  type="date"
                  value={formData.contract_start}
                  onChange={(e) => setFormData({...formData, contract_start: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mietende (optional)</label>
                <Input
                  type="date"
                  value={formData.contract_end}
                  onChange={(e) => setFormData({...formData, contract_end: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kaution (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.security_deposit}
                  onChange={(e) => setFormData({...formData, security_deposit: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setStep('template')} variant="outline">
                Zurück
              </Button>
              <Button onClick={handleGenerateContract} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Vertrag generieren
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && contractHtml && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Vertrag-Vorschau</span>
              <Button onClick={handleDownloadPDF} size="sm" className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Herunterladen
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded max-h-96 overflow-auto">
              <div dangerouslySetInnerHTML={{ __html: contractHtml }} className="prose prose-sm max-w-none text-gray-800" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}