import React from 'react';
import EnhancedAdminMessaging from '@/components/admin/EnhancedAdminMessaging';
import RoleBasedGuard from '@/components/admin/RoleBasedGuard';

export default function AdminMessagingCenter() {
  return (
    <RoleBasedGuard requiredRole="admin">
      <EnhancedAdminMessaging />
    </RoleBasedGuard>
  );
}