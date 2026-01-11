import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RentalLawComplianceChecker from '@/components/compliance/RentalLawComplianceChecker';
import EnergyPassportManager from '@/components/compliance/EnergyPassportManager';
import HeritageProtectionTracker from '@/components/compliance/HeritageProtectionTracker';
import PortfolioReportingDashboard from '@/components/reporting/PortfolioReportingDashboard';
import BenchmarkComparison from '@/components/reporting/BenchmarkComparison';

export default function ComplianceReportingHub() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: building } = useQuery({
    queryKey: ['building', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const buildings = await base44.asServiceRole.entities.Building.filter({
        created_by: user.email
      }, '-created_date', 1);
      return buildings[0];
    },
    enabled: !!user?.email
  });

  const companyId = building?.company_id || user?.company_id;

  if (!companyId) return <div className="text-center py-12">Lade Daten...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance & Reporting</h1>
        <p className="text-slate-600 mt-1">
          Mietrechts-Checks, Energieausweise & Portfolio-Analysen
        </p>
      </div>

      <Tabs defaultValue="compliance" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="energy">Energie</TabsTrigger>
          <TabsTrigger value="heritage">Denkmal</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
        </TabsList>

        <TabsContent value="compliance">
          <RentalLawComplianceChecker companyId={companyId} />
        </TabsContent>

        <TabsContent value="energy">
          <EnergyPassportManager companyId={companyId} />
        </TabsContent>

        <TabsContent value="heritage">
          <HeritageProtectionTracker companyId={companyId} />
        </TabsContent>

        <TabsContent value="portfolio">
          <PortfolioReportingDashboard companyId={companyId} />
        </TabsContent>

        <TabsContent value="benchmark">
          <BenchmarkComparison companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}