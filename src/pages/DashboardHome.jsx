import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import VermieterDashboard from './VermieterDashboard';
import MieterDashboard from './MieterDashboard';
import AdminDashboardTemplate from './AdminDashboardTemplate';

export default function DashboardHome() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Determine user type and show appropriate dashboard
  if (user?.role === 'admin') {
    return <AdminDashboardTemplate />;
  }

  // Check if user is a tenant (simplified check)
  const isTenant = user?.user_type === 'mieter';
  
  if (isTenant) {
    return <MieterDashboard />;
  }

  // Default: Vermieter Dashboard
  return <VermieterDashboard />;
}