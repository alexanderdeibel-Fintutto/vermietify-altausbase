import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UserSystemSetup() {
  const [step, setStep] = useState(1);

  const initializeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('initializeRolesAndPermissions');
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setStep(2);
    },
    onError: (error) => {
      toast.error(error.message || 'Fehler bei Initialisierung');
    }
  });

  const migrateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('migrateUserSystem');
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setStep(3);
    },
    onError: (error) => {
      toast.error(error.message || 'Fehler bei Migration');
    }
  });

  const handleInitialize = () => {
    initializeMutation.mutate();
  };

  const handleMigrate = () => {
    migrateMutation.mutate();
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Benutzerverwaltung Setup</CardTitle>
        <CardDescription>
          Einrichtung des erweiterten Benutzerverwaltungssystems
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Schritt 1 */}
          <div className={`p-4 border rounded-lg ${step >= 1 ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Schritt 1: System initialisieren</h3>
              {step > 1 && <Check className="w-5 h-5 text-emerald-600" />}
            </div>
            <p className="text-slate-600 text-sm mb-4">
              Erstellt alle nötigen Rollen, Berechtigungen und Module
            </p>
            {step === 1 && (
              <Button 
                onClick={handleInitialize} 
                disabled={initializeMutation.isPending}
                className="w-full"
              >
                {initializeMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Initialisiere...</>
                ) : (
                  <><ArrowRight className="w-4 h-4 mr-2" /> System initialisieren</>
                )}
              </Button>
            )}
          </div>

          {/* Schritt 2 */}
          <div className={`p-4 border rounded-lg ${step >= 2 ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Schritt 2: Bestehende User migrieren</h3>
              {step > 2 && <Check className="w-5 h-5 text-emerald-600" />}
            </div>
            <p className="text-slate-600 text-sm mb-4">
              Weist bestehenden Benutzern die neuen Rollen zu
            </p>
            {step === 2 && (
              <Button 
                onClick={handleMigrate} 
                disabled={migrateMutation.isPending}
                className="w-full"
              >
                {migrateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Migriere...</>
                ) : (
                  <><ArrowRight className="w-4 h-4 mr-2" /> Migration starten</>
                )}
              </Button>
            )}
          </div>

          {/* Schritt 3 - Fertig */}
          {step === 3 && (
            <div className="p-6 border border-emerald-200 bg-emerald-50 rounded-lg text-center">
              <div className="text-emerald-600 text-4xl mb-4">✅</div>
              <h3 className="font-semibold text-lg mb-2">Setup abgeschlossen!</h3>
              <p className="text-slate-600 mb-4">
                Das Benutzerverwaltungssystem ist jetzt aktiv
              </p>
              <Button onClick={() => window.location.href = createPageUrl('UserManagement')}>
                Zur Benutzerverwaltung
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}