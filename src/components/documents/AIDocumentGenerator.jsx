import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Wand2, Loader2, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

const TEMPLATES = [
  { value: 'lease_agreement', label: 'Mietvertrag', icon: '📄' },
  { value: 'notice_to_vacate', label: 'Kündigungsschreiben', icon: '📋' },
  { value: 'maintenance_summary', label: 'Wartungszusammenfassung', icon: '🔧' },
  { value: 'rent_increase_notice', label: 'Mieterhöhung', icon: '📈' },
  { value: 'handover_protocol', label: 'Übergabeprotokoll', icon: '🔑' }
];

export default function AIDocumentGenerator({ open, onClose }) {
  const [templateType, setTemplateType] = useState('lease_agreement');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedContract, setSelectedContract] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [customData, setCustomData] = useState({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [generating, setGenerating] = useState(false);

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-ai-gen'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-ai-gen'],
    queryFn: () => base44.entities.LeaseContract.list(),
    enabled: !!selectedTenant
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-ai-gen'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units-ai-gen'],
    queryFn: () => base44.entities.Unit.list(),
    enabled: !!selectedBuilding
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateAIDocument', {
        templateType,
        tenantId: selectedTenant,
        contractId: selectedContract,
        buildingId: selectedBuilding,
        unitId: selectedUnit,
        customData
      });

      setGeneratedContent(response.data.content);
      toast.success('Dokument erfolgreich generiert');
    } catch (error) {
      toast.error('Fehler beim Generieren: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDocument = async () => {
    try {
      await base44.entities.Document.create({
        name: `${TEMPLATES.find(t => t.value === templateType)?.label} - ${new Date().toLocaleDateString('de-DE')}`,
        category: 'Mietrecht',
        status: 'erstellt',
        content: generatedContent,
        tenant_id: selectedTenant,
        building_id: selectedBuilding,
        unit_id: selectedUnit,
        contract_id: selectedContract
      });
      
      toast.success('Dokument gespeichert');
      onClose();
    } catch (error) {
      toast.error('Fehler beim Speichern: ' + error.message);
    }
  };

  const renderCustomFields = () => {
    switch (templateType) {
      case 'notice_to_vacate':
        return (
          <>
            <div>
              <Label>Kündigungsdatum</Label>
              <Input
                type="date"
                value={customData.notice_date || ''}
                onChange={(e) => setCustomData({ ...customData, notice_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Auszugsdatum</Label>
              <Input
                type="date"
                value={customData.moveout_date || ''}
                onChange={(e) => setCustomData({ ...customData, moveout_date: e.target.value })}
              />
            </div>
          </>
        );
      case 'rent_increase_notice':
        return (
          <>
            <div>
              <Label>Neue Miete (€)</Label>
              <Input
                type="number"
                value={customData.new_rent || ''}
                onChange={(e) => setCustomData({ ...customData, new_rent: e.target.value })}
              />
            </div>
            <div>
              <Label>Gültig ab</Label>
              <Input
                type="date"
                value={customData.effective_date || ''}
                onChange={(e) => setCustomData({ ...customData, effective_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Begründung</Label>
              <Textarea
                value={customData.reason || ''}
                onChange={(e) => setCustomData({ ...customData, reason: e.target.value })}
                placeholder="z.B. Anpassung an ortsübliche Vergleichsmiete"
              />
            </div>
          </>
        );
      case 'handover_protocol':
        return (
          <>
            <div>
              <Label>Art der Übergabe</Label>
              <Select
                value={customData.handover_type || 'Einzug'}
                onValueChange={(value) => setCustomData({ ...customData, handover_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Einzug">Einzug</SelectItem>
                  <SelectItem value="Auszug">Auszug</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Übergabedatum</Label>
              <Input
                type="date"
                value={customData.handover_date || ''}
                onChange={(e) => setCustomData({ ...customData, handover_date: e.target.value })}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-600" />
            KI-Dokumenten-Generator
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Left: Configuration */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>Dokumententyp</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {TEMPLATES.map((template) => (
                      <Button
                        key={template.value}
                        variant={templateType === template.value ? 'default' : 'outline'}
                        className="justify-start"
                        onClick={() => setTemplateType(template.value)}
                      >
                        <span className="mr-2">{template.icon}</span>
                        {template.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Mieter</Label>
                  <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mieter auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.first_name} {tenant.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Gebäude</Label>
                  <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                    <SelectTrigger>
                      <SelectValue placeholder="Gebäude auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedBuilding && (
                  <div>
                    <Label>Einheit</Label>
                    <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Einheit auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {units.filter(u => u.building_id === selectedBuilding).map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedTenant && (
                  <div>
                    <Label>Mietvertrag (optional)</Label>
                    <Select value={selectedContract} onValueChange={setSelectedContract}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vertrag auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {contracts.filter(c => c.tenant_id === selectedTenant).map((contract) => (
                          <SelectItem key={contract.id} value={contract.id}>
                            {contract.start_date} - {contract.total_rent}€
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {renderCustomFields()}

                <Button
                  onClick={handleGenerate}
                  disabled={generating || !selectedTenant}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generiere...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Dokument generieren
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Vorschau</Label>
                  {generatedContent && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleSaveDocument}>
                        <Download className="w-4 h-4 mr-1" />
                        Speichern
                      </Button>
                    </div>
                  )}
                </div>

                {generatedContent ? (
                  <div className="bg-white border rounded-lg p-6 min-h-[500px] max-h-[600px] overflow-y-auto">
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                      {generatedContent}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border-2 border-dashed rounded-lg p-12 min-h-[500px] flex flex-col items-center justify-center text-center">
                    <FileText className="w-16 h-16 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">Kein Dokument generiert</p>
                    <p className="text-sm text-slate-400 mt-2">
                      Wählen Sie einen Dokumententyp und die erforderlichen Daten aus,
                      <br />dann klicken Sie auf "Dokument generieren"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}