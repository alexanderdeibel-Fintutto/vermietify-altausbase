import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function CTABanner({ title, description, buttonText = 'Jetzt starten' }) {
  return (
    <div className="bg-gradient-to-r from-[var(--vf-primary-600)] to-[var(--vf-accent-500)] text-white py-16 px-6 rounded-2xl text-center">
      <h2 className="text-3xl font-bold mb-4">{title || 'Bereit loszulegen?'}</h2>
      <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
        {description || 'Starten Sie noch heute und erleben Sie, wie einfach Immobilienverwaltung sein kann.'}
      </p>
      <Button variant="secondary" size="lg">
        {buttonText}
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
}