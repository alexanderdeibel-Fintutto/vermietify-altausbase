import React from 'react';
import { Check, Loader2 } from 'lucide-react';

export default function AutoSaveIndicator({ isSaving, lastSaved }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--theme-text-muted)]">
      {isSaving ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Speichert...</span>
        </>
      ) : lastSaved ? (
        <>
          <Check className="h-3 w-3 text-[var(--vf-success-500)]" />
          <span>Gespeichert um {new Date(lastSaved).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
        </>
      ) : null}
    </div>
  );
}