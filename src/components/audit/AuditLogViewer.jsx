import React from 'react';
import UserAuditLogViewer from '@/components/admin/UserAuditLogViewer';

export default function AuditLogViewer({ userId, limit }) {
  return <UserAuditLogViewer userId={userId} limit={limit} />;
}