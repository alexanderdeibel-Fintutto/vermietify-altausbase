import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function VfHeroSection({ 
  headline, 
  subheadline, 
  primaryCTA, 
  secondaryCTA,
  gradient = true 
}) {
  return (
    <div className={gradient ? 'vf-hero vf-hero-gradient' : 'vf-hero'}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h1 className="vf-hero-headline">{headline}</h1>
        {subheadline && <p className="vf-hero-subheadline">{subheadline}</p>}
        <div className="vf-hero-ctas">
          {primaryCTA && (
            <Button variant="gradient" size="lg" onClick={primaryCTA.onClick}>
              {primaryCTA.label}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          )}
          {secondaryCTA && (
            <Button variant="outline" size="lg" onClick={secondaryCTA.onClick}>
              {secondaryCTA.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}