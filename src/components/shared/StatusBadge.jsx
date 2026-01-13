import React from 'react';
import { Badge } from '@/components/ui/badge';

const STATUS_CONFIG = {
  success: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Erfolgreich' },
  error: { bg: 'bg-red-100', text: 'text-red-800', label: 'Fehler' },
  warning: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Warnung' },
  info: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Information' },
  pending: { bg: 'bg-slate-100', text: 'text-slate-800', label: 'Ausstehend' },
  active: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Aktiv' },
  inactive: { bg: 'bg-slate-100', text: 'text-slate-800', label: 'Inaktiv' },
};

export default function StatusBadge({ 
  status = 'pending',
  label,
  dot = false
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  
  return (
    <Badge className={`${config.bg} ${config.text} border-0 font-medium`}>
      {dot && <span className="w-2 h-2 bg-current rounded-full inline-block mr-1" />}
      {label || config.label}
    </Badge>
  );
}