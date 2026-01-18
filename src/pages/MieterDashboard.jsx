import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfProgress } from '@/components/shared/VfProgress';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import { Mail, Phone, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MieterDashboard() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const nextRent = {
    amount: 1030,
    dueDate: new Date('2026-02-03'),
    daysUntil: 16,
    progress: 70
  };

  return (
    <div className="min-h-screen bg-[var(--theme-background)] p-6 theme-mieter">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Willkommen, {user?.full_name || 'Mieter'}! 👋</h1>
          <p className="text-[var(--theme-text-secondary)]">
            Whg. 1.OG links • Hauptstraße 1, Berlin
          </p>
        </div>

        <Card className="vf-rent-card mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="vf-rent-card__label mb-2">NÄCHSTE MIETZAHLUNG</div>
                <div className="vf-rent-card__amount">
                  <CurrencyDisplay amount={nextRent.amount} />
                </div>
                <div className="text-sm text-[var(--theme-text-secondary)] mt-1">
                  Warmmiete Februar 2026
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-[var(--theme-text-muted)]">Fällig am</div>
                <div className="font-bold">{nextRent.dueDate.toLocaleDateString('de-DE')}</div>
              </div>
            </div>
            <VfProgress value={nextRent.progress} variant="success" className="mb-2" />
            <div className="vf-rent-card__countdown">Noch {nextRent.daysUntil} Tage</div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Meine Dokumente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-[var(--theme-surface)] rounded-lg">
                  <span className="text-sm">📄 Mietvertrag</span>
                  <span className="text-xs text-[var(--theme-text-muted)]">2024</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[var(--theme-surface)] rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📄 BK-Abrechnung</span>
                    <AlertCircle className="h-4 w-4 text-[var(--vf-error-500)]" />
                  </div>
                  <span className="text-xs text-[var(--theme-text-muted)]">2024</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[var(--theme-surface)] rounded-lg">
                  <span className="text-sm">📄 Hausordnung</span>
                  <span className="text-xs text-[var(--theme-text-muted)]">2023</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                Alle Dokumente →
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kontakt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="vf-contact-card mb-3">
                <div className="vf-contact-card__name mb-3">Ihr Vermieter</div>
                <div className="font-semibold mb-2">Alexander Mustermann</div>
                <div className="vf-contact-card__detail">
                  <Mail className="h-4 w-4" />
                  vermieter@example.de
                </div>
                <div className="vf-contact-card__detail">
                  <Phone className="h-4 w-4" />
                  +49 170 1234567
                </div>
              </div>
              <Button variant="gradient" size="sm" className="w-full">
                Nachricht senden
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schaden melden</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                🔧 Schaden melden
              </Button>
              <div className="text-center text-sm text-[var(--theme-text-muted)] mt-3">
                Offene Meldungen: 0
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zahlungshistorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['Jan 2026', 'Dez 2025', 'Nov 2025'].map((month) => (
                  <div key={month} className="flex justify-between items-center text-sm">
                    <span>✓ {month}</span>
                    <span>€1.030</span>
                    <span className="text-[var(--vf-success-600)]">✅ Bezahlt</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}