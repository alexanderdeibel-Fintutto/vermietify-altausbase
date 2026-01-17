import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfDashboard, VfDashboardWidget, VfDueItem } from '@/components/dashboards/VfDashboard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Euro, FileText, MessageSquare, AlertCircle } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function MieterDashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Mock tenant data - in real app, fetch from tenant entity
  const nextPayment = {
    amount: 1030,
    dueDate: addDays(new Date(), 17),
    description: 'Warmmiete Februar 2026',
    status: 'pending'
  };

  const daysUntilDue = Math.ceil((nextPayment.dueDate - new Date()) / (1000 * 60 * 60 * 24));
  const progressValue = Math.max(0, 100 - (daysUntilDue / 30) * 100);

  return (
    <div className="theme-mieter">
      <VfDashboard
        greeting={`Willkommen, ${user?.full_name || 'Mieter'}! 👋`}
        date={`Whg. 1.OG links • Hauptstraße 1, Berlin`}
      >
        <div className="max-w-5xl mx-auto">
          {/* Rent Payment Card */}
          <Card className="mb-6 vf-rent-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Nächste Mietzahlung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="vf-rent-card__amount">
                    {nextPayment.amount.toLocaleString('de-DE')} €
                  </div>
                  <div className="vf-rent-card__label">{nextPayment.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[var(--theme-text-primary)]">
                    Fällig am {format(nextPayment.dueDate, 'dd.MM.yyyy')}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    Zahlungsdetails
                  </Button>
                </div>
              </div>
              
              <div className="vf-rent-card__progress">
                <div 
                  className="vf-rent-card__progress-bar" 
                  style={{ width: `${progressValue}%` }}
                />
              </div>
              <div className="vf-rent-card__countdown">
                Noch {daysUntilDue} Tage
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Documents */}
            <VfDashboardWidget
              title="Meine Dokumente"
              footer={
                <button className="text-sm text-[var(--theme-primary)] hover:underline">
                  Alle Dokumente →
                </button>
              }
            >
              <div className="space-y-2">
                <VfDueItem
                  title="Mietvertrag"
                  subtitle="2024"
                  priority="normal"
                />
                <VfDueItem
                  title="BK-Abrechnung"
                  subtitle="2024"
                  priority="urgent"
                />
                <VfDueItem
                  title="Hausordnung"
                  subtitle="2023"
                  priority="normal"
                />
              </div>
            </VfDashboardWidget>

            {/* Contact */}
            <VfDashboardWidget title="Kontakt">
              <div className="vf-contact-card">
                <div className="vf-contact-card__name">Ihr Vermieter</div>
                <div className="vf-contact-card__name mt-1 text-sm font-normal">
                  Alexander Mustermann
                </div>
                <div className="vf-contact-card__detail">
                  <MessageSquare className="h-4 w-4" />
                  vermieter@example.de
                </div>
                <div className="vf-contact-card__detail">
                  <MessageSquare className="h-4 w-4" />
                  +49 170 1234567
                </div>
                <Button variant="primary" className="w-full mt-4">
                  Nachricht senden
                </Button>
              </div>
            </VfDashboardWidget>

            {/* Damage Report */}
            <VfDashboardWidget title="Schaden melden">
              <Button variant="outline" className="w-full">
                <AlertCircle className="h-4 w-4 mr-2" />
                Schaden melden
              </Button>
              <p className="text-sm text-[var(--theme-text-muted)] mt-3">
                Offene Meldungen: 0
              </p>
            </VfDashboardWidget>

            {/* Payment History */}
            <VfDashboardWidget
              title="Zahlungshistorie"
              footer={
                <button className="text-sm text-[var(--theme-primary)] hover:underline">
                  Alle Zahlungen →
                </button>
              }
            >
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Jan 2026</span>
                  <span className="font-semibold">1.030 €</span>
                  <span className="vf-badge vf-badge-success">Bezahlt</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Dez 2025</span>
                  <span className="font-semibold">1.030 €</span>
                  <span className="vf-badge vf-badge-success">Bezahlt</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Nov 2025</span>
                  <span className="font-semibold">1.030 €</span>
                  <span className="vf-badge vf-badge-success">Bezahlt</span>
                </div>
              </div>
            </VfDashboardWidget>
          </div>
        </div>
      </VfDashboard>
    </div>
  );
}