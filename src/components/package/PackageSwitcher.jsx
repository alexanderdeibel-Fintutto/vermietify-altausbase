import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, ArrowRight, Loader2 } from 'lucide-react';

const PACKAGES = [
  {
    type: 'easyKonto',
    name: 'Easy Konto',
    price: 0,
    period: 'kostenlos',
    description: 'Für persönliche Finanzplanung',
    limits: { buildings: 0, units: 0 }
  },
  {
    type: 'easySteuer',
    name: 'Easy Steuer',
    price: 19.99,
    period: '/Monat',
    description: 'Steuererklärung leicht gemacht',
    limits: { buildings: 0, units: 0 }
  },
  {
    type: 'easyHome',
    name: 'Easy Home',
    price: 29.99,
    period: '/Monat',
    description: 'Für eine kleine Immobilie',
    limits: { buildings: 1, units: 10 }
  },
  {
    type: 'easyVermieter',
    name: 'Easy Vermieter',
    price: 39.99,
    period: '/Monat',
    description: 'Vollständiges Verwaltungssystem',
    limits: { buildings: 1, units: 999 },
    recommended: true
  },
  {
    type: 'easyGewerbe',
    name: 'Easy Gewerbe',
    price: 59.99,
    period: '/Monat',
    description: 'Mehrere Objekte & Gewerbebetrieb',
    limits: { buildings: 5, units: 999 }
  }
];

export default function PackageSwitcher({ currentPackage }) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const queryClient = useQueryClient();

  const switchPackageMutation = useMutation({
    mutationFn: (packageType) =>
      base44.functions.invoke('switchPackage', { package_type: packageType }),
    onSuccess: () => {
      toast.success('Paket erfolgreich gewechselt');
      queryClient.invalidateQueries({ queryKey: ['user-package'] });
      setSelectedPackage(null);
    },
    onError: (error) => toast.error(error.message || 'Paketwechsel fehlgeschlagen')
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Paket-Auswahl</h3>
        <p className="text-sm text-slate-600">
          Upgrade auf ein höheres Paket, um mehr Objekte und Wohneinheiten zu verwalten
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {PACKAGES.map(pkg => {
          const isActive = currentPackage === pkg.type;

          return (
            <Card
              key={pkg.type}
              className={`relative transition-all ${
                isActive ? 'ring-2 ring-emerald-500 bg-emerald-50' : ''
              } ${pkg.recommended ? 'md:ring-2 md:ring-blue-300' : ''}`}
            >
              {pkg.recommended && !isActive && (
                <Badge className="absolute top-2 right-2 bg-blue-500">Empfohlen</Badge>
              )}
              {isActive && (
                <Badge className="absolute top-2 right-2 bg-emerald-600">Aktiv</Badge>
              )}

              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{pkg.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="text-2xl font-bold">
                  €{pkg.price}
                  <span className="text-xs text-slate-500 font-normal ml-1">{pkg.period}</span>
                </div>

                <p className="text-xs text-slate-600">{pkg.description}</p>

                <div className="space-y-1 text-xs">
                  <div className="text-slate-700">
                    <span className="font-medium">{pkg.limits.buildings}</span> Objekt{pkg.limits.buildings !== 1 ? 'e' : ''}
                  </div>
                  <div className="text-slate-700">
                    <span className="font-medium">{pkg.limits.units}</span> Wohneinheiten
                  </div>
                </div>

                {isActive ? (
                  <Button disabled className="w-full" size="sm">
                    <Check className="w-4 h-4 mr-1" />
                    Aktiv
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant={pkg.type === 'easyGewerbe' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedPackage(pkg);
                      switchPackageMutation.mutate(pkg.type);
                    }}
                    disabled={switchPackageMutation.isPending}
                    className="w-full"
                  >
                    {switchPackageMutation.isPending && selectedPackage?.type === pkg.type ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Wird...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 mr-1" />
                        Wechseln
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}