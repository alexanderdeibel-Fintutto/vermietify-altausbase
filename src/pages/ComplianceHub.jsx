import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AuditLogViewer from '@/components/audit/AuditLogViewer';
import ApprovalQueue from '@/components/collaboration/ApprovalQueue';

export default function ComplianceHub() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance & Genehmigungen</h1>
        <p className="text-slate-600 text-sm mt-1">Audit-Logs, Genehmigungswarteschlange</p>
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="audit">📋 Audit-Log</TabsTrigger>
          <TabsTrigger value="approvals">✅ Genehmigungen</TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit-Protokoll</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditLogViewer />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Genehmigungswarteschlange</CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalQueue />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}