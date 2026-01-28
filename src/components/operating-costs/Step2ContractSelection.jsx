import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/components/services/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Home, Calendar, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { parseISO, differenceInDays } from 'date-fns';

export default function Step2ContractSelection({ data, onNext, onBack, onDataChange, onSaveDraft, isSaving }) {
  const [contracts, setContracts] = useState(data.contracts || []);
  const [vacancies, setVacancies] = useState(data.vacancies || []);

  const { data: allContracts = [] } = useQuery({
    queryKey: ['leaseContracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_active_leases')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_tenant_list')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_units_with_lease')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    calculateContractsAndVacancies();
  }, []);

  const calculateContractsAndVacancies = () => {
    const periodStart = parseISO(data.period_start);
    const periodEnd = parseISO(data.period_end);

    const relevantContracts = allContracts.filter(c => 
      data.selected_units.includes(c.unit_id) &&
      c.start_date <= data.period_end &&
      (!c.end_date || c.end_date >= data.period_start)
    );

    // Effektive Zeiträume berechnen
    const processedContracts = relevantContracts.map(c => ({
      ...c,
      effective_start: c.start_date < data.period_start ? data.period_start : c.start_date,
      effective_end: !c.end_date || c.end_date > data.period_end ? data.period_end : c.end_date,
      number_of_persons: c.number_of_persons || 1
    }));

    // Leerstände identifizieren
    const calculatedVacancies = [];
    
    for (const unitId of data.selected_units) {
      const unitContracts = processedContracts
        .filter(c => c.unit_id === unitId)
        .sort((a, b) => new Date(a.effective_start) - new Date(b.effective_start));

      let currentDate = new Date(periodStart);
      const endDate = new Date(periodEnd);

      while (currentDate <= endDate) {
        const dayStr = currentDate.toISOString().split('T')[0];
        const isCovered = unitContracts.some(c => 
          dayStr >= c.effective_start && dayStr <= c.effective_end
        );

        if (!isCovered) {
          const lastVacancy = calculatedVacancies[calculatedVacancies.length - 1];
          if (lastVacancy && lastVacancy.unit_id === unitId) {
            lastVacancy.vacancy_end = dayStr;
          } else {
            calculatedVacancies.push({
              unit_id: unitId,
              vacancy_start: dayStr,
              vacancy_end: dayStr,
              is_vacancy: true
            });
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    setContracts(processedContracts);
    setVacancies(calculatedVacancies);
  };

  const updatePersonCount = (contractId, value) => {
    setContracts(prev => prev.map(c => 
      c.id === contractId ? { ...c, number_of_persons: parseInt(value) || 0 } : c
    ));
  };

  const getTenant = (tenantId) => tenants.find(t => t.id === tenantId);
  const getUnit = (unitId) => units.find(u => u.id === unitId);

  const hasOverlaps = () => {
    for (const unitId of data.selected_units) {
      const unitContracts = contracts.filter(c => c.unit_id === unitId);
      for (let i = 0; i < unitContracts.length; i++) {
        for (let j = i + 1; j < unitContracts.length; j++) {
          const c1 = unitContracts[i];
          const c2 = unitContracts[j];
          if (c1.effective_start <= c2.effective_end && c2.effective_start <= c1.effective_end) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const handleNext = () => {
    if (hasOverlaps()) {
      toast.error('Es gibt überlappende Mietverträge. Bitte prüfen Sie die Zeiträume.');
      return;
    }

    onDataChange({ contracts, vacancies });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Mietverträge & Leerstände</h2>
        <p className="text-gray-600">Überprüfen Sie die Verträge und ergänzen Sie die Personenanzahl</p>
      </div>

      {/* Mietverträge */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <User className="w-5 h-5" />
          Mietverträge ({contracts.length})
        </h3>

        {contracts.map(contract => {
          const tenant = getTenant(contract.tenant_id);
          const unit = getUnit(contract.unit_id);

          return (
            <Card key={contract.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <p className="font-medium">
                      {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt'}
                    </p>
                    <Badge variant="outline">{unit?.unit_number}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(contract.effective_start).toLocaleDateString('de-DE')} - 
                    {new Date(contract.effective_end).toLocaleDateString('de-DE')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {differenceInDays(parseISO(contract.effective_end), parseISO(contract.effective_start)) + 1} Tage
                  </p>
                </div>

                <div className="w-32">
                  <Label className="text-xs">Personen</Label>
                  <Input
                    type="number"
                    min="1"
                    value={contract.number_of_persons || 1}
                    onChange={(e) => updatePersonCount(contract.id, e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Leerstände */}
      {vacancies.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Home className="w-5 h-5 text-orange-600" />
            Leerstände ({vacancies.length})
          </h3>

          {vacancies.map((vacancy, idx) => {
            const unit = getUnit(vacancy.unit_id);
            const days = differenceInDays(
              parseISO(vacancy.vacancy_end), 
              parseISO(vacancy.vacancy_start)
            ) + 1;

            return (
              <Card key={idx} className="p-4 bg-orange-50 border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Home className="w-4 h-4 text-orange-600" />
                      <p className="font-medium">Leerstand</p>
                      <Badge variant="outline" className="bg-white">{unit?.unit_number}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(vacancy.vacancy_start).toLocaleDateString('de-DE')} - 
                      {new Date(vacancy.vacancy_end).toLocaleDateString('de-DE')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{days} Tage</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Validierung Hinweise */}
      {hasOverlaps() && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">
            Warnung: Es gibt überlappende Mietverträge für eine oder mehrere Einheiten!
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Zurück
          </Button>
          <Button 
            variant="outline" 
            onClick={onSaveDraft}
            disabled={isSaving}
          >
            {isSaving ? 'Speichert...' : 'Entwurf speichern'}
          </Button>
        </div>
        <Button onClick={handleNext} className="bg-blue-900">
          Weiter
        </Button>
      </div>
    </div>
  );
}