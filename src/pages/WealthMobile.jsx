import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobilePortfolioDashboard from '@/components/wealth/MobilePortfolioDashboard';
import MobileFilterDialog from '@/components/wealth/MobileFilterDialog';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Download } from 'lucide-react';

export default function WealthMobilePage() {
  const queryClient = useQueryClient();
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => await base44.auth.me()
  });

  const { data: portfolio = [] } = useQuery({
    queryKey: ['assetPortfolio', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const results = await base44.entities.AssetPortfolio.filter({
        user_id: user.id,
        status: 'active'
      });
      return results || [];
    }
  });

  const handleExport = async () => {
    try {
      const response = await base44.functions.invoke('exportPortfolioReport', {
        portfolio,
        format: 'pdf'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'portfolio.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center pt-2">
          <h1 className="text-2xl font-bold text-slate-900">Vermögen</h1>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5 text-slate-600" />
          </Button>
        </div>

        {/* Dashboard */}
        <MobilePortfolioDashboard portfolio={portfolio} onExport={handleExport} />

        {/* Filter Dialog */}
        <MobileFilterDialog open={filterOpen} onOpenChange={setFilterOpen} onApply={() => {}} />

        {/* Floating Action Button */}
        <div className="fixed bottom-20 right-4">
          <Button className="rounded-full w-14 h-14 shadow-lg gap-2">
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}