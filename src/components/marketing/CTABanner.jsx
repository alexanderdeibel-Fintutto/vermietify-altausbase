import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function CTABanner({ 
  title, 
  description, 
  buttonText = 'Jetzt starten',
  buttonHref,
  variant = 'gradient' 
}) {
  return (
    <div className={variant === 'gradient' 
      ? 'bg-[var(--vf-gradient-primary)] text-white' 
      : 'bg-[var(--vf-primary-50)]'
    }>
      <div className="max-w-6xl mx-auto px-6 py-12 text-center">
        <h2 className={`text-3xl font-bold mb-4 ${variant === 'gradient' ? 'text-white' : ''}`}>
          {title}
        </h2>
        <p className={`text-lg mb-6 ${variant === 'gradient' ? 'opacity-90' : 'text-[var(--theme-text-secondary)]'}`}>
          {description}
        </p>
        <a href={buttonHref}>
          <Button variant={variant === 'gradient' ? 'secondary' : 'gradient'} size="lg">
            {buttonText}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </a>
      </div>
    </div>
  );
}