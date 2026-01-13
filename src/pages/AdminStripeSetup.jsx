import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Copy, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminStripeSetup() {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('In Zwischenablage kopiert');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: '1. Stripe-Konto erstellen',
      description: 'Registriere dich bei Stripe und aktiviere deinen Account',
      action: 'https://dashboard.stripe.com/register',
      actionLabel: 'Zu Stripe'
    },
    {
      title: '2. API-Keys hinterlegen',
      description: 'Hole deine API-Keys aus dem Stripe Dashboard und setze sie in den Secrets',
      action: 'https://dashboard.stripe.com/apikeys',
      actionLabel: 'API Keys holen',
      secrets: [
        { name: 'STRIPE_SECRET_KEY', example: 'sk_test_...' },
        { name: 'STRIPE_WEBHOOK_SECRET', example: 'whsec_...' }
      ]
    },
    {
      title: '3. Produkte in Stripe anlegen',
      description: 'Erstelle für jeden Plan ein Produkt mit Pricing',
      details: [
        'Gehe zu Products → Add Product',
        'Name: z.B. "Starter Plan"',
        'Erstelle 2 Prices: Monthly + Yearly',
        'Kopiere die Price IDs (price_...)',
        'Trage sie in SubscriptionPlan ein'
      ]
    },
    {
      title: '4. Webhook einrichten',
      description: 'Stripe muss deine App über Zahlungen informieren',
      webhook: {
        url: `${window.location.origin}/api/functions/stripe/webhook`,
        events: [
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.paid',
          'invoice.payment_failed'
        ]
      }
    },
    {
      title: '5. Test-Subscription anlegen',
      description: 'Teste mit Stripe Test-Cards',
      testCards: [
        { number: '4242 4242 4242 4242', result: 'Erfolg' },
        { number: '4000 0000 0000 0002', result: 'Declined' },
        { number: '4000 0000 0000 9995', result: 'Insufficient Funds' }
      ]
    },
    {
      title: '6. Live-Modus aktivieren',
      description: 'Wechsle zu Live-Keys wenn alles funktioniert',
      alert: 'Wichtig: Live-Mode erst aktivieren wenn alle Tests erfolgreich!'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-light text-slate-900">Stripe Setup Guide</h1>
        <p className="text-sm text-slate-600">Schritt-für-Schritt zur Zahlungsintegration</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Wichtig:</strong> Nutze zunächst Test-Keys (sk_test_...). Erst nach erfolgreichen Tests auf Live-Keys umstellen.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                </div>
                {step.action && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={step.action} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      {step.actionLabel}
                    </a>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {step.secrets && (
                <div className="space-y-3">
                  {step.secrets.map((secret, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm font-mono text-slate-700">{secret.name}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(secret.name, `secret-${i}`)}
                        >
                          {copiedIndex === `secret-${i}` ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <div className="text-xs text-slate-500">Beispiel: {secret.example}</div>
                    </div>
                  ))}
                </div>
              )}

              {step.details && (
                <ul className="space-y-2">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              )}

              {step.webhook && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Webhook URL:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(step.webhook.url, 'webhook')}
                      >
                        {copiedIndex === 'webhook' ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <code className="text-xs text-slate-600 break-all">{step.webhook.url}</code>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-2">Events auswählen:</div>
                    <div className="flex flex-wrap gap-2">
                      {step.webhook.events.map((event, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-mono">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step.testCards && (
                <div className="space-y-2">
                  {step.testCards.map((card, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <code className="text-sm font-mono text-slate-700">{card.number}</code>
                      <Badge variant={card.result === 'Erfolg' ? 'default' : 'destructive'}>
                        {card.result}
                      </Badge>
                    </div>
                  ))}
                  <p className="text-xs text-slate-500 mt-2">
                    CVV: beliebig, Ablaufdatum: in der Zukunft, PLZ: beliebig
                  </p>
                </div>
              )}

              {step.alert && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{step.alert}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-emerald-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="text-base text-emerald-900">
            ✅ Setup abgeschlossen?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-emerald-800">
          <p>
            Wenn alle Schritte erledigt sind, kannst du auf der <strong>/pricing</strong>-Seite
            testen ob Subscriptions funktionieren. Nach erfolgreicher Test-Zahlung sollte der User
            in der Subscription-Übersicht erscheinen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}