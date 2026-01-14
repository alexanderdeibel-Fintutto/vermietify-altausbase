import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ChevronRight, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

const ONBOARDING_STEPS = [
  { 
    id: 'building_created', 
    label: 'Erstes Gebäude anlegen',
    check: (data) => data.buildings?.length > 0,
    link: 'Buildings'
  },
  { 
    id: 'units_added', 
    label: 'Einheiten zum Gebäude hinzufügen',
    check: (data) => data.units?.length > 0,
    link: 'Buildings',
    description: 'Über Gebäude → Einheiten Tab'
  },
  { 
    id: 'purchase_contract', 
    label: 'Kaufvertrag mit Grundstücksanteil erfassen',
    check: (data) => data.purchaseContracts?.length > 0,
    link: 'Buildings'
  },
  { 
    id: 'owners_assigned', 
    label: 'Eigentümer mit Anteilen zuordnen',
    check: (data) => data.buildingOwnerships?.length > 0,
    link: 'Buildings'
  },
  { 
    id: 'first_contract', 
    label: 'Ersten Mietvertrag erstellen',
    check: (data) => data.contracts?.length > 0,
    link: 'Contracts',
    description: 'Über Gebäude → Einheit → Neuer Vertrag'
  },
  { 
    id: 'bookings_generated', 
    label: '"Buchungen generieren" klicken',
    check: (data) => data.generatedBookings?.length > 0,
    link: 'GeneratedBookings'
  },
  { 
    id: 'bank_connected', 
    label: 'Bankverbindung einrichten',
    check: (data) => data.bankAccounts?.length > 0,
    link: 'BankAccounts'
  },
  { 
    id: 'invoice_categorized', 
    label: 'Erste Rechnung kategorisieren',
    check: (data) => data.invoices?.some(i => i.cost_type_id),
    link: 'Invoices'
  }
];

export default function OnboardingChecklistWidget({ compact = false }) {
  const [collapsed, setCollapsed] = useState(false);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list()
  });

  const { data: purchaseContracts = [] } = useQuery({
    queryKey: ['purchase_contracts'],
    queryFn: () => base44.entities.PurchaseContract.list()
  });

  const { data: buildingOwnerships = [] } = useQuery({
    queryKey: ['building_ownerships'],
    queryFn: () => base44.entities.BuildingOwnership.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const { data: generatedBookings = [] } = useQuery({
    queryKey: ['generated_bookings'],
    queryFn: () => base44.entities.PlannedBooking.list()
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['bank_accounts'],
    queryFn: () => base44.entities.BankAccount.list()
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list()
  });

  const allData = {
    buildings,
    units,
    purchaseContracts,
    buildingOwnerships,
    contracts,
    generatedBookings,
    bankAccounts,
    invoices
  };

  const completedSteps = ONBOARDING_STEPS.filter(step => step.check(allData));
  const progress = (completedSteps.length / ONBOARDING_STEPS.length) * 100;
  const isComplete = progress === 100;

  // Auto-collapse when complete
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => setCollapsed(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  // Don't show if complete and user preference is set
  const hideCompleted = localStorage.getItem('hide_onboarding_checklist') === 'true';
  if (isComplete && hideCompleted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-20"
    >
      <Card className={`${isComplete ? 'bg-green-50 border-green-200' : 'bg-white'} transition-all`}>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setCollapsed(!collapsed)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className={`w-5 h-5 ${isComplete ? 'text-green-600' : 'text-blue-600'}`} />
              <CardTitle className="text-base">
                {isComplete ? '✨ Onboarding abgeschlossen!' : 'Erste Schritte'}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">
                {completedSteps.length}/{ONBOARDING_STEPS.length}
              </span>
              <ChevronRight 
                className={`w-4 h-4 text-slate-400 transition-transform ${collapsed ? '' : 'rotate-90'}`} 
              />
            </div>
          </div>
          <Progress value={progress} className="h-2 mt-2" />
        </CardHeader>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent className="space-y-2">
                {ONBOARDING_STEPS.map((step) => {
                  const isCompleted = step.check(allData);
                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3 p-2 rounded-lg transition-all ${
                        isCompleted ? 'bg-green-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${isCompleted ? 'line-through text-slate-500' : 'text-slate-700'}`}>
                          {step.label}
                        </p>
                        {step.description && !isCompleted && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {step.description}
                          </p>
                        )}
                      </div>
                      {!isCompleted && (
                        <Link to={createPageUrl(step.link)}>
                          <Button size="sm" variant="ghost" className="text-xs h-7">
                            Los
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })}

                {isComplete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-xs"
                    onClick={() => {
                      localStorage.setItem('hide_onboarding_checklist', 'true');
                      setCollapsed(true);
                    }}
                  >
                    Checkliste ausblenden
                  </Button>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}