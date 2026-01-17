import React from 'react';
import { VfBadge } from './VfBadge';

export default function StatusBadge({ status }) {
  const statusConfig = {
    active: { variant: 'success', label: 'Aktiv' },
    inactive: { variant: 'default', label: 'Inaktiv' },
    pending: { variant: 'warning', label: 'Ausstehend' },
    draft: { variant: 'default', label: 'Entwurf' },
    sent: { variant: 'info', label: 'Versendet' },
    paid: { variant: 'success', label: 'Bezahlt' },
    overdue: { variant: 'error', label: 'Überfällig' },
    cancelled: { variant: 'error', label: 'Gekündigt' },
    expired: { variant: 'default', label: 'Abgelaufen' }
  };

  const config = statusConfig[status?.toLowerCase()] || { variant: 'default', label: status };

  return <VfBadge variant={config.variant}>{config.label}</VfBadge>;
}