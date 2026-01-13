import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSubscription } from '@/components/hooks/useSubscription';
import { useAllLimits } from '@/components/hooks/useAllLimits';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UsageMeter } from '@/components/subscription/UsageMeter';
import { TrialBanner } from '@/components/subscription/TrialBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Calendar, 
  Package, 
  BarChart3,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function SubscriptionSettings() {
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: allLimits, isLoading: limitsLoading } = useAllLimits();
  const [billingCycle, setBillingCycle] = useState('monthly');

  const { data: invoices = [] } = useQuery({
    queryKey: ['subscriptionInvoices', subscription?.subscription?.user_email],
    queryFn: () => base44.entities.SubscriptionInvoice.filter({
      user_email: subscription.subscription.user_email
    }),
    enabled: !!subscription?.subscription?.user_email
  });

  if (subLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="h-32 bg-slate-100 rounded" />
          <div className="h-64 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Kein Abonnement</CardTitle>
            <CardDescription>Du hast noch kein aktives Abonnement.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Abonnement auswählen</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusIcons = {
    trialing: <AlertCircle className="h-5 w-5 text-blue-500" />,
    active: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    past_due: <XCircle className="h-5 w-5 text-red-500" />,
    canceled: <XCircle className="h-5 w-5 text-slate-400" />,
  };

  const statusTexts = {
    trialing: 'Testphase',
    active: 'Aktiv',
    past_due: 'Zahlung ausstehend',
    canceled: 'Gekündigt',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-light text-slate-900 mb-2">Mein Abonnement</h1>
        <p className="text-sm text-slate-600">Verwalte deinen Plan, Add-Ons und Nutzung</p>
      </div>

      <TrialBanner />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="addons">Add-Ons</TabsTrigger>
          <TabsTrigger value="usage">Nutzung</TabsTrigger>
          <TabsTrigger value="invoices">Rechnungen</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-3">
                    <span>Aktueller Plan: {subscription.plan.name}</span>
                    {statusIcons[subscription.subscription.status]}
                  </CardTitle>
                  <CardDescription>
                    Status: {statusTexts[subscription.subscription.status]}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">Plan ändern</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">Nächste Zahlung:</span>
                  <span className="font-medium">
                    {format(new Date(subscription.subscription.current_period_end), 'dd.MM.yyyy', { locale: de })}
                    {' '}
                    ({(subscription.monthlySpend / 100).toFixed(2)}€)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">Abrechnungsart:</span>
                  <span className="font-medium">
                    {subscription.subscription.billing_cycle === 'monthly' ? 'Monatlich' : 'Jährlich'}
                  </span>
                  {subscription.subscription.billing_cycle === 'monthly' && (
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                      Zu jährlich wechseln
                    </Button>
                  )}
                </div>
              </div>

              {subscription.isTrial && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      Testphase endet am {format(new Date(subscription.subscription.trial_end), 'dd.MM.yyyy', { locale: de })}
                      {' '}({subscription.daysLeftInTrial} Tage)
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Limits Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Nutzungsübersicht</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!limitsLoading && allLimits?.limits && (
                <>
                  {Object.entries(allLimits.limits).map(([key, limit]) => (
                    <UsageMeter key={key} limitKey={key} />
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADD-ONS TAB */}
        <TabsContent value="addons" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Aktive Add-Ons</CardTitle>
                <Button size="sm">Add-On kaufen</Button>
              </div>
            </CardHeader>
            <CardContent>
              {subscription.addons.length === 0 ? (
                <p className="text-sm text-slate-600 text-center py-8">
                  Keine Add-Ons aktiviert
                </p>
              ) : (
                <div className="space-y-3">
                  {subscription.addons.map(addon => (
                    <AddonItem key={addon.id} addon={addon} />
                  ))}
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-slate-900">Monatliche Gesamtkosten:</span>
                      <span className="text-lg font-light">{(subscription.monthlySpend / 100).toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* USAGE TAB */}
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detaillierte Nutzung</CardTitle>
              <CardDescription>Aktuelle Auslastung deiner Limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!limitsLoading && allLimits?.limits && (
                <>
                  {Object.entries(allLimits.limits).map(([key, limit]) => (
                    <UsageMeter key={key} limitKey={key} showUpgradeHint size="lg" />
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* INVOICES TAB */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rechnungen</CardTitle>
                <Button size="sm" variant="outline">Alle anzeigen</Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-slate-600 text-center py-8">
                  Keine Rechnungen vorhanden
                </p>
              ) : (
                <div className="space-y-2">
                  {invoices.slice(0, 5).map(invoice => (
                    <div key={invoice.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-sm font-medium">
                            {format(new Date(invoice.period_start), 'dd.MM.yyyy')}
                          </div>
                          <div className="text-xs text-slate-600">
                            {invoice.invoice_number || invoice.stripe_invoice_id}
                          </div>
                        </div>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'}>
                          {invoice.status === 'paid' ? '✓ Bezahlt' : invoice.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          {(invoice.amount_paid / 100).toFixed(2)}€
                        </span>
                        {invoice.invoice_pdf_url && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={invoice.invoice_pdf_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Zahlungsmethode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-slate-400" />
                  <span className="text-sm">Über Stripe verwaltet</span>
                </div>
                <Button variant="outline" size="sm">
                  Im Stripe ändern
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {subscription.isActive && (
        <div className="pt-6 border-t">
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
            Abo kündigen
          </Button>
        </div>
      )}
    </div>
  );
}

function AddonItem({ addon }) {
  const { data: addonData } = useQuery({
    queryKey: ['addon', addon.addon_id],
    queryFn: async () => {
      const addons = await base44.entities.SubscriptionAddOn.filter({ id: addon.addon_id });
      return addons[0];
    }
  });

  if (!addonData) return null;

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center text-xl">
          {addonData.icon === 'Building2' ? '🏦' : addonData.icon === 'MessageCircle' ? '💬' : '📊'}
        </div>
        <div>
          <div className="text-sm font-medium">{addonData.name}</div>
          <div className="text-xs text-slate-600">
            Seit {format(new Date(addon.activated_at), 'dd.MM.yyyy', { locale: de })}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {addon.is_included_in_plan ? (
          <Badge variant="secondary">Inklusive</Badge>
        ) : (
          <span className="text-sm font-medium">{(addon.price_at_purchase / 100).toFixed(2)}€/Mon</span>
        )}
        {!addon.is_included_in_plan && (
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
            Kündigen
          </Button>
        )}
      </div>
    </div>
  );
}