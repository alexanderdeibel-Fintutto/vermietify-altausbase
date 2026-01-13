import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function UmlagefaehigBadge({ status = 'umlagefaehig' }) {
  const config = {
    umlagefaehig: {
      icon: '🟢',
      label: 'Umlagefähig (BetrKV)',
      className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
    },
    nicht_umlagefaehig: {
      icon: '🔴',
      label: 'Nicht umlagefähig',
      className: 'bg-red-100 text-red-800 hover:bg-red-200',
    },
    teilweise: {
      icon: '🟡',
      label: 'Teilweise umlagefähig',
      className: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    },
  };

  const selected = config[status] || config.umlagefaehig;

  return (
    <Badge className={selected.className}>
      {selected.icon} {selected.label}
    </Badge>
  );
}