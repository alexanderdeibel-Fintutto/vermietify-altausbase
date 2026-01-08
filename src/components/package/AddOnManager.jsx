import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Plus, Loader2, Mail, CheckCircle, FileText, Zap } from 'lucide-react';
import UpgradeDialog from './UpgradeDialog';

const ADDONS = [
  {
    id: 'dokumentation',
    name: 'Dokumentenverwaltung',
    description: 'Speichere und verwalte Dokumente, Verträge und Vorlagen zentral',
    price: 9.99,
    features: ['Unbegrenzte Dokumente', 'PDF-Templates', 'Automatische Archivierung'],
    icon: FileText
  },
  {
    id: 'kommunikation',
    name: 'Kommunikation',
    description: 'E-Mail, WhatsApp und SMS Integration für Mieterkommunikation',
    price: 14.99,
    features: ['WhatsApp-Integration', 'Email-Templates', 'SMS-Versand'],
    icon: Mail
  },
  {
    id: 'aufgaben',
    name: 'Aufgabenverwaltung',
    description: 'Verwalte Aufgaben, Reminders und Workflows automatisch',
    price: 12.99,
    features: ['Task-Management', 'Automation', 'Reminders & Notifications'],
    icon: Zap
  }
];

export default function AddOnManager({ packageConfig }) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState(null);
  const queryClient = useQueryClient();

  const addAddOnMutation = useMutation({
    mutationFn: (addonId) =>
      base44.functions.invoke('purchaseAddon', { addon_id: addonId }),
    onSuccess: () => {
      toast.success('Add-on erfolgreich hinzugefügt');
      queryClient.invalidateQueries({ queryKey: ['user-package'] });
    },
    onError: () => toast.error('Add-on-Kauf fehlgeschlagen')
  });

  const activeModules = packageConfig?.additional_modules || [];

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Zusatz-Module</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ADDONS.map(addon => {
            const isActive = activeModules.includes(addon.id);
            const Icon = addon.icon;

            return (
              <Card key={addon.id} className={isActive ? 'border-emerald-500 bg-emerald-50' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-slate-600" />
                      <CardTitle className="text-base">{addon.name}</CardTitle>
                    </div>
                    {isActive && (
                      <Badge className="bg-emerald-600">
                        <Check className="w-3 h-3 mr-1" />
                        Aktiv
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">{addon.description}</p>
                  
                  <ul className="space-y-2">
                    {addon.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-slate-900">€{addon.price}/Monat</span>
                    </div>
                    
                    {isActive ? (
                      <Button disabled className="w-full">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aktiviert
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setSelectedAddon(addon);
                          setShowUpgradeDialog(true);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        disabled={addAddOnMutation.isPending}
                      >
                        {addAddOnMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Wird hinzugefügt...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Hinzufügen
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        addon={selectedAddon}
        onConfirm={() => {
          if (selectedAddon) {
            addAddOnMutation.mutate(selectedAddon.id);
          }
        }}
      />
    </>
  );
}