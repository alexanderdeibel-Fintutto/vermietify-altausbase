import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Bell, ArrowRight } from 'lucide-react';
import { format, differenceInDays, isBefore, addMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DeadlineWarningSystem() {
  const heute = new Date();

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-expiring'],
    queryFn: async () => {
      const all = await base44.entities.LeaseContract.list('-end_date', 100);
      return all.filter(c => 
        c.vertragsart === 'Befristet' && 
        c.end_date && 
        differenceInDays(new Date(c.end_date), heute) <= 90 &&
        differenceInDays(new Date(c.end_date), heute) > 0
      );
    }
  });

  const { data: bkStatements = [] } = useQuery({
    queryKey: ['bk-statements-due'],
    queryFn: async () => {
      const all = await base44.entities.OperatingCostStatement.list('-zeitraum_bis', 50);
      return all.filter(s => 
        s.frist_zustellung && 
        differenceInDays(new Date(s.frist_zustellung), heute) <= 60 &&
        s.status !== 'Versendet'
      );
    }
  });

  const { data: supplierContracts = [] } = useQuery({
    queryKey: ['supplier-contracts-cancellation'],
    queryFn: async () => {
      const all = await base44.entities.SupplierContract.list(null, 100);
      return all.filter(c => 
        c.kuendigung_bis && 
        differenceInDays(new Date(c.kuendigung_bis), heute) <= 60 &&
        c.status === 'Aktiv'
      );
    }
  });

  const totalWarnings = contracts.length + bkStatements.length + supplierContracts.length;

  if (totalWarnings === 0) {
    return null;
  }

  return (
    <Card className="border-amber-300 bg-amber-50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Bell className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {totalWarnings} bevorstehende Fristen
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                Wichtige Termine in den nächsten 90 Tagen
              </p>
            </div>

            {/* Verträge auslaufend */}
            {contracts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-900">Auslaufende Mietverträge:</p>
                {contracts.slice(0, 3).map(contract => {
                  const tageVerbleibend = differenceInDays(new Date(contract.end_date), heute);
                  return (
                    <div key={contract.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-sm">Vertrag läuft aus in {tageVerbleibend} Tagen</span>
                      </div>
                      <Badge className={tageVerbleibend <= 30 ? 'bg-red-600' : 'bg-amber-600'}>
                        {format(new Date(contract.end_date), 'dd.MM.yyyy', { locale: de })}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}

            {/* BK-Abrechnungen */}
            {bkStatements.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-900">BK-Abrechnungen fällig:</p>
                {bkStatements.slice(0, 3).map(statement => {
                  const tageVerbleibend = differenceInDays(new Date(statement.frist_zustellung), heute);
                  return (
                    <div key={statement.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-sm">BK-Abrechnung {statement.abrechnungsjahr} - Frist in {tageVerbleibend} Tagen</span>
                      </div>
                      <Badge className={tageVerbleibend <= 30 ? 'bg-red-600' : 'bg-amber-600'}>
                        {format(new Date(statement.frist_zustellung), 'dd.MM.yyyy', { locale: de })}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Versorger-Kündigungsfristen */}
            {supplierContracts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-900">Kündigungsfristen Verträge:</p>
                {supplierContracts.slice(0, 3).map(contract => {
                  const tageVerbleibend = differenceInDays(new Date(contract.kuendigung_bis), heute);
                  return (
                    <div key={contract.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-sm">{contract.vertragsart} - {contract.anbieter_name}</span>
                      </div>
                      <Badge className={tageVerbleibend <= 30 ? 'bg-red-600' : 'bg-amber-600'}>
                        Kündigen bis {format(new Date(contract.kuendigung_bis), 'dd.MM.yyyy', { locale: de })}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}

            {totalWarnings > 6 && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to={createPageUrl('Tasks')}>
                  Alle Fristen anzeigen <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}