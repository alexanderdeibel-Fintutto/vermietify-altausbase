import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RentOptimizationWidget() {
  const { data: contracts = [] } = useQuery({
    queryKey: ['activeContracts'],
    queryFn: () => base44.entities.LeaseContract.filter({ vertragsstatus: 'Aktiv' })
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: rentIndices = [] } = useQuery({
    queryKey: ['rentIndices'],
    queryFn: () => base44.entities.RentIndex.list()
  });

  const calculatePotential = () => {
    let totalPotential = 0;
    let contractsWithPotential = 0;

    contracts.forEach(contract => {
      const unit = units.find(u => u.id === contract.unit_id);
      const building = buildings.find(b => b.id === unit?.gebaeude_id);

      if (!unit || !building) return;

      const relevantIndex = rentIndices.find(idx => 
        idx.city === building.city &&
        idx.wohnlage === (unit.mietspiegel_lage || 'Mittel')
      );

      if (relevantIndex) {
        const currentPerSqm = contract.kaltmiete / unit.wohnflaeche_qm;
        const targetPerSqm = relevantIndex.miete_mittel;
        
        if (targetPerSqm > currentPerSqm) {
          const potentialIncrease = (targetPerSqm - currentPerSqm) * unit.wohnflaeche_qm;
          const increasePercent = (potentialIncrease / contract.kaltmiete * 100);
          
          if (increasePercent <= 15) {
            totalPotential += potentialIncrease;
            contractsWithPotential++;
          }
        }
      }
    });

    return {
      totalPotential: totalPotential.toFixed(0),
      contractsCount: contractsWithPotential,
      monthlyPotential: totalPotential.toFixed(0),
      yearlyPotential: (totalPotential * 12).toFixed(0)
    };
  };

  const potential = calculatePotential();

  if (potential.contractsCount === 0) return null;

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-600 rounded-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <CardTitle className="text-base">Mieterhöhungspotential</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-3xl font-light text-emerald-900">
            +{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(potential.monthlyPotential)}
          </p>
          <p className="text-sm text-emerald-700 mt-1">
            monatlich möglich bei {potential.contractsCount} Vertrag(en)
          </p>
        </div>

        <div className="bg-white/60 rounded-lg p-3">
          <p className="text-xs text-slate-600">Jährlich:</p>
          <p className="text-lg font-medium text-slate-900">
            +{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(potential.yearlyPotential)}
          </p>
        </div>

        <Link to={createPageUrl('LeaseContracts')}>
          <Button size="sm" variant="outline" className="w-full bg-white">
            Verträge prüfen
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}