import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  UserX, 
  UserPlus, 
  FileText, 
  Euro, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ProgressTracker from '@/components/shared/ProgressTracker';

const WIZARD_STEPS = [
  'Vertrag beenden',
  'Kaution zurückzahlen',
  'Neuer Mieter',
  'Neuer Vertrag',
  'Übergabe'
];

export default function TenantChangeWizard({ open, onClose, currentContract, unit }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [endDate, setEndDate] = useState('');
  const [endReason, setEndReason] = useState('');
  const [depositReturn, setDepositReturn] = useState(null);
  const [depositAmount, setDepositAmount] = useState(0);
  const [newTenantMode, setNewTenantMode] = useState('existing'); // 'existing' or 'new'
  const [selectedTenant, setSelectedTenant] = useState('');
  const [newTenantData, setNewTenantData] = useState({});
  const [newContractData, setNewContractData] = useState({});
  const [handoverNotes, setHandoverNotes] = useState('');

  const queryClient = useQueryClient();

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits', currentContract?.id],
    queryFn: async () => {
      const deps = await base44.entities.Deposit.filter({ 
        contract_id: currentContract?.id 
      });
      return deps;
    },
    enabled: !!currentContract
  });

  // Pre-fill new contract with current data
  useEffect(() => {
    if (currentContract) {
      setNewContractData({
        rent_kalt: currentContract.rent_kalt,
        rent_warm: currentContract.rent_warm,
        nebenkosten_vorauszahlung: currentContract.nebenkosten_vorauszahlung,
        deposit_amount: currentContract.deposit_amount
      });
      
      const deposit = deposits[0];
      if (deposit) {
        setDepositAmount(deposit.amount || currentContract.deposit_amount || 0);
      }
    }
  }, [currentContract, deposits]);

  const completeMutation = useMutation({
    mutationFn: async () => {
      // Step 1: End current contract
      await base44.entities.LeaseContract.update(currentContract.id, {
        end_date: endDate,
        end_reason: endReason,
        status: 'ended'
      });

      // Step 2: Return deposit if specified
      if (depositReturn && depositAmount > 0) {
        await base44.entities.ActualPayment.create({
          contract_id: currentContract.id,
          tenant_id: currentContract.tenant_id,
          amount: -depositAmount,
          payment_date: endDate,
          type: 'deposit_return',
          description: 'Kautionsrückzahlung bei Mieterwechsel'
        });
      }

      // Step 3: Create new tenant if needed
      let newTenantId = selectedTenant;
      if (newTenantMode === 'new') {
        const tenant = await base44.entities.Tenant.create(newTenantData);
        newTenantId = tenant.id;
      }

      // Step 4: Create new contract
      const newContract = await base44.entities.LeaseContract.create({
        ...newContractData,
        unit_id: unit.id,
        building_id: unit.building_id,
        tenant_id: newTenantId,
        start_date: endDate,
        status: 'active'
      });

      // Step 5: Create handover protocol if notes provided
      if (handoverNotes) {
        await base44.entities.HandoverProtocol.create({
          unit_id: unit.id,
          old_contract_id: currentContract.id,
          new_contract_id: newContract.id,
          handover_date: endDate,
          notes: handoverNotes,
          status: 'completed'
        });
      }

      return newContract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success('Mieterwechsel erfolgreich abgeschlossen');
      onClose();
    },
    onError: (error) => {
      toast.error('Fehler beim Mieterwechsel: ' + error.message);
    }
  });

  const handleNext = () => {
    if (currentStep === 0 && !endDate) {
      toast.error('Bitte Enddatum angeben');
      return;
    }
    if (currentStep === 2 && newTenantMode === 'new' && !newTenantData.first_name) {
      toast.error('Bitte Mieterdaten eingeben');
      return;
    }
    if (currentStep === 2 && newTenantMode === 'existing' && !selectedTenant) {
      toast.error('Bitte Mieter auswählen');
      return;
    }
    if (currentStep === 3 && !newContractData.start_date) {
      toast.error('Bitte Startdatum angeben');
      return;
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleFinish = () => {
    completeMutation.mutate();
  };

  if (!currentContract || !unit) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mieterwechsel für {unit.unit_number}</DialogTitle>
        </DialogHeader>

        <ProgressTracker steps={WIZARD_STEPS} currentStep={currentStep} />

        <div className="py-6 space-y-6">
          {/* Step 0: Vertrag beenden */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <UserX className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Aktueller Vertrag</p>
                    <p className="text-sm text-blue-700">
                      Mieter: {currentContract.tenant_name}
                    </p>
                    <p className="text-sm text-blue-700">
                      Start: {new Date(currentContract.start_date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              </Card>

              <div>
                <Label>Enddatum des aktuellen Vertrags *</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={currentContract.start_date}
                />
              </div>

              <div>
                <Label>Kündigungsgrund</Label>
                <Select value={endReason} onValueChange={setEndReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Grund wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant_termination">Kündigung durch Mieter</SelectItem>
                    <SelectItem value="landlord_termination">Kündigung durch Vermieter</SelectItem>
                    <SelectItem value="mutual_agreement">Einvernehmlich</SelectItem>
                    <SelectItem value="expiration">Befristung abgelaufen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 1: Kaution */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Card className="p-4 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-3">
                  <Euro className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Kaution</p>
                    <p className="text-sm text-amber-700">
                      Hinterlegte Kaution: €{depositAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>

              <div>
                <Label>Kaution zurückzahlen?</Label>
                <Select 
                  value={depositReturn} 
                  onValueChange={(val) => setDepositReturn(val === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Ja, vollständig zurückzahlen</SelectItem>
                    <SelectItem value="no">Nein, später bearbeiten</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {depositReturn && (
                <div>
                  <Label>Rückzahlungsbetrag</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Neuer Mieter */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newTenantMode === 'existing' ? 'default' : 'outline'}
                  onClick={() => setNewTenantMode('existing')}
                  className="flex-1"
                >
                  Vorhandener Mieter
                </Button>
                <Button
                  type="button"
                  variant={newTenantMode === 'new' ? 'default' : 'outline'}
                  onClick={() => setNewTenantMode('new')}
                  className="flex-1"
                >
                  Neuer Mieter
                </Button>
              </div>

              {newTenantMode === 'existing' ? (
                <div>
                  <Label>Mieter auswählen *</Label>
                  <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mieter wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.first_name} {t.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Vorname *</Label>
                      <Input
                        value={newTenantData.first_name || ''}
                        onChange={(e) => setNewTenantData({
                          ...newTenantData,
                          first_name: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label>Nachname *</Label>
                      <Input
                        value={newTenantData.last_name || ''}
                        onChange={(e) => setNewTenantData({
                          ...newTenantData,
                          last_name: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>E-Mail</Label>
                    <Input
                      type="email"
                      value={newTenantData.email || ''}
                      onChange={(e) => setNewTenantData({
                        ...newTenantData,
                        email: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label>Telefon</Label>
                    <Input
                      value={newTenantData.phone || ''}
                      onChange={(e) => setNewTenantData({
                        ...newTenantData,
                        phone: e.target.value
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Neuer Vertrag */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-start gap-3">
                  <UserPlus className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Neuer Vertrag</p>
                    <p className="text-sm text-green-700">
                      Vertragsdaten wurden von altem Vertrag übernommen
                    </p>
                  </div>
                </div>
              </Card>

              <div>
                <Label>Startdatum des neuen Vertrags *</Label>
                <Input
                  type="date"
                  value={newContractData.start_date || endDate}
                  onChange={(e) => setNewContractData({
                    ...newContractData,
                    start_date: e.target.value
                  })}
                  min={endDate}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Kaltmiete</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newContractData.rent_kalt || ''}
                    onChange={(e) => setNewContractData({
                      ...newContractData,
                      rent_kalt: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div>
                  <Label>Nebenkosten-Vorauszahlung</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newContractData.nebenkosten_vorauszahlung || ''}
                    onChange={(e) => setNewContractData({
                      ...newContractData,
                      nebenkosten_vorauszahlung: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>

              <div>
                <Label>Kaution (neuer Vertrag)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newContractData.deposit_amount || ''}
                  onChange={(e) => setNewContractData({
                    ...newContractData,
                    deposit_amount: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
            </div>
          )}

          {/* Step 4: Übergabeprotokoll */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Übergabeprotokoll (optional)</p>
                    <p className="text-sm text-blue-700">
                      Dokumentieren Sie den Zustand der Wohnung bei Übergabe
                    </p>
                  </div>
                </div>
              </Card>

              <div>
                <Label>Notizen zur Übergabe</Label>
                <Textarea
                  placeholder="z.B. Mängel, Zählerstände, Schlüsselübergabe..."
                  rows={6}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                />
              </div>

              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800 font-medium">
                    Bereit zum Abschließen
                  </p>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  Der alte Vertrag wird beendet und ein neuer Vertrag wird erstellt.
                </p>
              </Card>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>

          {currentStep < WIZARD_STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Weiter
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleFinish}
              disabled={completeMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {completeMutation.isPending ? 'Wird gespeichert...' : 'Mieterwechsel abschließen'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}