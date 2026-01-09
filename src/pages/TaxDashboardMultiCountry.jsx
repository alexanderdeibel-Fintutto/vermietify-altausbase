import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ComprehensiveTaxDashboard from '@/components/tax/ComprehensiveTaxDashboard';

export default function TaxDashboardMultiCountry() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => base44.auth.me()
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <ComprehensiveTaxDashboard />
    </div>
  );
}