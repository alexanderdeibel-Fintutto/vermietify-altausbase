import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Users, HardDrive, FileText, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function TenantIsolationDashboard({ tenantId }) {
  const { data: quotaData, refetch } = useQuery({
    queryKey: ['tenant-quota', tenantId],
    queryFn: async () => {
      const result = await base44.functions.invoke('manageTenantIsolation', {
        action: 'check_quota',
        tenant_id: tenantId
      });
      return result.data;
    }
  });

  const { data: violations } = useQuery({
    queryKey: ['isolation-violations', tenantId],
    queryFn: async () => {
      const result = await base44.functions.invoke('manageTenantIsolation', {
        action: 'enforce_isolation',
        tenant_id: tenantId
      });
      return result.data.violations || [];
    }
  });

  const quota = quotaData?.quota;
  const access = quotaData?.tenant_access;

  return (
    <div className="space-y-4">
      {/* Tenant Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Tenant: {tenantId}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">Isolation Level:</span>
            <Badge>{access?.isolation_level}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Data Residency:</span>
            <Badge variant="outline">{access?.data_residency}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quota Cards */}
      {quota && (
        <div className="grid gap-3">
          {/* Storage */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Storage</span>
                </div>
                <Badge variant={quota.storage.percentage > 80 ? 'destructive' : 'outline'}>
                  {quota.storage.percentage}%
                </Badge>
              </div>
              <Progress value={quota.storage.percentage} className="h-2" />
              <p className="text-xs text-slate-600 mt-1">
                {quota.storage.used} / {quota.storage.limit} GB
              </p>
            </CardContent>
          </Card>

          {/* Users */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Benutzer</span>
                </div>
                <Badge variant={quota.users.percentage > 80 ? 'destructive' : 'outline'}>
                  {quota.users.percentage}%
                </Badge>
              </div>
              <Progress value={quota.users.percentage} className="h-2" />
              <p className="text-xs text-slate-600 mt-1">
                {quota.users.used} / {quota.users.limit}
              </p>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Dokumente</span>
                </div>
                <Badge variant={quota.documents.percentage > 80 ? 'destructive' : 'outline'}>
                  {quota.documents.percentage}%
                </Badge>
              </div>
              <Progress value={quota.documents.percentage} className="h-2" />
              <p className="text-xs text-slate-600 mt-1">
                {quota.documents.used} / {quota.documents.limit}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Violations */}
      {violations && violations.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              Isolation-Verstöße ({violations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {violations.map((v, i) => (
                <div key={i} className="p-2 bg-red-50 rounded text-xs">
                  <p className="font-medium">Doc: {v.document_id}</p>
                  <p className="text-red-700">{v.violation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}