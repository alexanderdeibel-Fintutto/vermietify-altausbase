import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Mail, Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const STEPS = [
  { id: 'tenant', title: 'Mieter-Daten' },
  { id: 'contract', title: 'Vertragsdetails' },
  { id: 'communication', title: 'Kommunikation' },
  { id: 'confirm', title: 'Bestätigung' }
];

export default function TenantOnboardingWizard({ isOpen, onClose, preselectedUnit, preselectedBuilding }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    // Tenant data
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    // Contract data
    unit_id: preselectedUnit || '',
    building_id: preselectedBuilding || '',
    start_date: null,
    is_unlimited: true,
    end_date: null,
    base_rent: '',
    utilities: '',
    heating: '',
    deposit: '',
    rent_due_day: 3,
    // Communication
    preferred_communication: 'email'
  });

  const queryClient = useQueryClient();

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', formData.building_id],
    queryFn: () => formData.building_id ? base44.entities.Unit.filter({ building_id: formData.building_id }) : [],
    enabled: !!formData.building_id
  });

  const createOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('initiateTenantOnboarding', {
        unit_id: formData.unit_id,
        building_id: formData.building_id,
        contract_data: {
          tenant_info: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone
          },
          start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : null,
          is_unlimited: formData.is_unlimited,
          end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null,
          base_rent: parseFloat(formData.base_rent),
          utilities: parseFloat(formData.utilities),
          heating: parseFloat(formData.heating),
          deposit: parseFloat(formData.deposit),
          rent_due_day: formData.rent_due_day
        },
        preferred_communication: formData.preferred_communication
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['onboardings']);
      toast.success('Onboarding gestartet! Dokumente wurden generiert und versendet.');
      onClose();
    },
    onError: (error) => {
      toast.error('Fehler beim Onboarding: ' + error.message);
    }
  });

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      createOnboardingMutation.mutate();
    }
  };

  const currentStep = STEPS[step];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neuer Mieter - Onboarding</DialogTitle>
          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((s, idx) => (
              <div key={s.id} className="flex-1">
                <div className={`h-2 rounded ${idx <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
                <p className="text-xs mt-1 text-center">{s.title}</p>
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Tenant Data */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vorname *</Label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Max"
                  />
                </div>
                <div>
                  <Label>Nachname *</Label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Mustermann"
                  />
                </div>
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="max@example.com"
                />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+49 123 456789"
                />
              </div>
            </div>
          )}

          {/* Step 2: Contract Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Gebäude *</Label>
                <Select value={formData.building_id} onValueChange={(v) => setFormData({ ...formData, building_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gebäude wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Wohnung *</Label>
                <Select value={formData.unit_id} onValueChange={(v) => setFormData({ ...formData, unit_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wohnung wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.unit_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mietbeginn *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(formData.start_date, 'dd.MM.yyyy') : 'Datum wählen'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar mode="single" selected={formData.start_date} onSelect={(date) => setFormData({ ...formData, start_date: date })} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Kaltmiete *</Label>
                  <Input
                    type="number"
                    value={formData.base_rent}
                    onChange={(e) => setFormData({ ...formData, base_rent: e.target.value })}
                    placeholder="800"
                  />
                </div>
                <div>
                  <Label>Nebenkosten</Label>
                  <Input
                    type="number"
                    value={formData.utilities}
                    onChange={(e) => setFormData({ ...formData, utilities: e.target.value })}
                    placeholder="150"
                  />
                </div>
                <div>
                  <Label>Heizkosten</Label>
                  <Input
                    type="number"
                    value={formData.heating}
                    onChange={(e) => setFormData({ ...formData, heating: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>
              <div>
                <Label>Kaution</Label>
                <Input
                  type="number"
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                  placeholder="2400"
                />
              </div>
            </div>
          )}

          {/* Step 3: Communication */}
          {step === 2 && (
            <div className="space-y-4">
              <Label>Wie möchten Sie die Dokumente versenden?</Label>
              <RadioGroup value={formData.preferred_communication} onValueChange={(v) => setFormData({ ...formData, preferred_communication: v })}>
                <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-slate-50">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold">Email</p>
                      <p className="text-xs text-slate-600">Sofortiger Versand per Email</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-slate-50">
                  <RadioGroupItem value="whatsapp" id="whatsapp" />
                  <Label htmlFor="whatsapp" className="flex items-center gap-2 cursor-pointer flex-1">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold">WhatsApp</p>
                      <p className="text-xs text-slate-600">Versand über WhatsApp</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-slate-50">
                  <RadioGroupItem value="post" id="post" />
                  <Label htmlFor="post" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Send className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-semibold">Briefpost</p>
                      <p className="text-xs text-slate-600">Versand per Post (LetterXpress)</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-2">Zusammenfassung</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Mieter:</strong> {formData.first_name} {formData.last_name}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Mietbeginn:</strong> {formData.start_date ? format(formData.start_date, 'dd.MM.yyyy') : 'N/A'}</p>
                  <p><strong>Warmmiete:</strong> {(parseFloat(formData.base_rent || 0) + parseFloat(formData.utilities || 0) + parseFloat(formData.heating || 0)).toFixed(2)}€</p>
                  <p><strong>Versand:</strong> {
                    formData.preferred_communication === 'email' ? 'Email' :
                    formData.preferred_communication === 'whatsapp' ? 'WhatsApp' :
                    'Briefpost'
                  }</p>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold mb-2">Folgende Dokumente werden automatisch erstellt:</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Mietvertrag</li>
                  <li>Übergabeprotokoll</li>
                  <li>Meldebescheinigung (Vorbereitung)</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : onClose()}>
            {step > 0 ? 'Zurück' : 'Abbrechen'}
          </Button>
          <Button onClick={handleNext} disabled={createOnboardingMutation.isPending}>
            {step < STEPS.length - 1 ? 'Weiter' : 'Onboarding starten'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}