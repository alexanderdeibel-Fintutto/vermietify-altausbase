import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UpgradeBanner({ onDismiss }) {
  return (
    <div className="bg-gradient-to-r from-[var(--vf-primary-600)] to-[var(--vf-accent-500)] text-white p-4 rounded-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Upgraden Sie jetzt!</h3>
          <p className="text-sm opacity-90">Schalten Sie alle Premium-Features frei</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={createPageUrl('Pricing')}>
            <Button variant="secondary" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          </Link>
          {onDismiss && (
            <button onClick={onDismiss} className="p-1 hover:bg-white/20 rounded">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}