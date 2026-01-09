import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SmartHints() {
  const [hints, setHints] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    loadHints();
  }, []);

  const loadHints = async () => {
    try {
      const [buildings, units, tenants, contracts, invoices] = await Promise.all([
        base44.entities.Building.list(),
        base44.entities.Unit.list(),
        base44.entities.Tenant.list(),
        base44.entities.LeaseContract.list(),
        base44.entities.Invoice.list()
      ]);

      const newHints = [];

      // Hint: Erste Einheiten anlegen
      if (buildings.length > 0 && units.length === 0) {
        newHints.push({
          id: 'units_empty',
          title: '🏠 Einheiten anlegen',
          message: 'Deine Gebäude sind bereit - lege jetzt die ersten Wohneinheiten an',
          action: 'Einheiten anlegen',
          page: 'UnitsManagement'
        });
      }

      // Hint: Erste Mieter hinzufügen
      if (units.length > 0 && tenants.length === 0) {
        newHints.push({
          id: 'tenants_empty',
          title: '👥 Mieter hinzufügen',
          message: 'Deine Einheiten warten auf Mieter - starte jetzt mit der Vermietung',
          action: 'Mieter anlegen',
          page: 'Tenants'
        });
      }

      // Hint: Erste Mietverträge
      if (tenants.length > 0 && contracts.length === 0) {
        newHints.push({
          id: 'contracts_empty',
          title: '📋 Mietverträge erstellen',
          message: 'Erstelle jetzt die Mietverträge für deine Mieter',
          action: 'Vertrag erstellen',
          page: 'LeaseContracts'
        });
      }

      // Hint: Finanzübersicht
      if (contracts.length > 0 && invoices.length === 0) {
        newHints.push({
          id: 'invoices_empty',
          title: '💰 Finanzübersicht einrichten',
          message: 'Beginne mit der Erfassung von Einnahmen und Ausgaben',
          action: 'Zur Finanzverwaltung',
          page: 'Finanzen'
        });
      }

      setHints(newHints.filter(h => !dismissed.has(h.id)));
    } catch (error) {
      console.error('Error loading hints:', error);
    }
  };

  const handleDismiss = (hintId) => {
    setDismissed(prev => new Set([...prev, hintId]));
    setHints(prev => prev.filter(h => h.id !== hintId));
  };

  const handleAction = (hint) => {
    navigate(createPageUrl(hint.page));
    handleDismiss(hint.id);
  };

  if (hints.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {hints.map((hint) => (
        <Card key={hint.id} className="border border-blue-200 bg-blue-50">
          <CardContent className="pt-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 mb-1">{hint.title}</h4>
              <p className="text-sm text-slate-600 mb-3">{hint.message}</p>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleAction(hint)}
                >
                  {hint.action}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleDismiss(hint.id)}
                >
                  Später
                </Button>
              </div>
            </div>
            <button
              onClick={() => handleDismiss(hint.id)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}