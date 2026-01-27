import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Zap } from 'lucide-react';
import { getPricing, formatPrice, calculateYearlySavings } from '@/components/services/pricing';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  
  const { data: pricing, isLoading } = useQuery({
    queryKey: ['pricing'],
    queryFn: getPricing,
    staleTime: 5 * 60 * 1000
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Preise werden geladen...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Preise & Pakete</h1>
          <p className="text-xl text-gray-600 mb-8">
            Wählen Sie das passende Paket für Ihre Nebenkostenabrechnungen
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-3 bg-white rounded-lg p-1 border">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === 'monthly' 
                  ? 'bg-blue-900 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Monatlich
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === 'yearly' 
                  ? 'bg-blue-900 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Jährlich
              {pricing?.[0]?.yearly_price && (
                <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                  -{calculateYearlySavings(pricing[0].monthly_price, pricing[0].yearly_price)}%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {pricing?.map(tier => {
            const price = billingCycle === 'monthly' ? tier.monthly_price : tier.yearly_price;
            const priceId = billingCycle === 'monthly' ? tier.monthly_price_id : tier.yearly_price_id;
            
            return (
              <Card 
                key={tier.tier} 
                className={tier.is_popular ? 'border-2 border-blue-900 shadow-lg relative' : ''}
              >
                {tier.is_popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-900 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      Empfohlen
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{tier.product_name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{formatPrice(price || 0)}</span>
                    <span className="text-gray-600">/{billingCycle === 'monthly' ? 'Monat' : 'Jahr'}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {tier.features?.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {tier.limits && (
                    <div className="text-sm text-gray-600 mb-6 space-y-1">
                      {tier.limits.maxBuildings && <p>• Bis zu {tier.limits.maxBuildings} Objekte</p>}
                      {tier.limits.maxUnits && <p>• Bis zu {tier.limits.maxUnits} Einheiten</p>}
                    </div>
                  )}
                  
                  <Button 
                    className="w-full"
                    variant={tier.is_popular ? 'default' : 'outline'}
                  >
                    Jetzt starten
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Cross-Sell Hint */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            💡 Tipp: Mit <strong>FinTuttO Vermietify</strong> erhalten Sie die komplette Immobilienverwaltung
          </p>
          <a 
            href="https://vermietify.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Mehr erfahren →
          </a>
        </div>
      </div>
    </div>
  );
}