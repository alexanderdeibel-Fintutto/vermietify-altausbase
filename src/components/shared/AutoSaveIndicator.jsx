import React from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';

export default function AutoSaveIndicator({ status = 'saved' }) {
  const states = {
    saving: { icon: Loader2, text: 'Speichert...', className: 'text-[var(--vf-info-600)]', spin: true },
    saved: { icon: Check, text: 'Gespeichert', className: 'text-[var(--vf-success-600)]' },
    error: { icon: AlertCircle, text: 'Fehler', className: 'text-[var(--vf-error-600)]' }
  };

  const state = states[status];
  const Icon = state.icon;

  return (
    <div className={`flex items-center gap-2 text-sm ${state.className}`}>
      <Icon className={`h-4 w-4 ${state.spin ? 'animate-spin' : ''}`} />
      <span>{state.text}</span>
    </div>
  );
}