import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Zap } from 'lucide-react';
import { formatPrice } from '../../services/pricing';

export default function PricingCard({ tier, billingCycle, onSelect, isPopular }) {
  const price = billingCycle === 'monthly' ? tier.monthly_price : tier.yearly_price;
  const features = tier.features || [];

  return (
    <Card className={`relative ${isPopular ? 'border-2 border-blue-900 shadow-xl' : ''}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-900 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-1">
            <Zap className="w-4 h-4" />
            Empfohlen
          </span>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">{tier.product_name}</CardTitle>
        {tier.product_description && (
          <p className="text-sm text-gray-600 mt-2">{tier.product_description}</p>
        )}
        <div className="mt-6">
          <span className="text-4xl font-bold">{formatPrice(price || 0)}</span>
          <span className="text-gray-600">/{billingCycle === 'monthly' ? 'Monat' : 'Jahr'}</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-3 mb-6">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        {tier.limits && (
          <div className="text-sm text-gray-600 mb-6 space-y-1 border-t pt-4">
            {tier.limits.maxBuildings && tier.limits.maxBuildings > 0 && (
              <p>• Bis zu {tier.limits.maxBuildings} Objekte</p>
            )}
            {tier.limits.maxUnits && tier.limits.maxUnits > 0 && (
              <p>• Bis zu {tier.limits.maxUnits} Einheiten</p>
            )}
          </div>
        )}
        
        <Button 
          className="w-full"
          variant={isPopular ? 'default' : 'outline'}
          onClick={() => onSelect?.(tier)}
        >
          Jetzt starten
        </Button>
      </CardContent>
    </Card>
  );
}