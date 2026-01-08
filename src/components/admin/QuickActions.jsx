import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Shield, Package, Key, Download, Upload, FileText, Zap } from 'lucide-react';
import { createPageUrl } from '../../utils';
import InviteUserDialog from '../users/InviteUserDialog';
import RoleImportDialog from '../roles/RoleImportDialog';
import SystemReportDialog from './SystemReportDialog';

export default function QuickActions() {
  const navigate = useNavigate();
  const [inviteOpen, setInviteOpen] = React.useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setInviteOpen(true)}>
            <UserPlus className="w-5 h-5" />
            <span className="text-xs">User einladen</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => navigate(createPageUrl('RoleManagement'))}>
            <Shield className="w-5 h-5" />
            <span className="text-xs">Neue Rolle</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => navigate(createPageUrl('ModuleManagement'))}>
            <Package className="w-5 h-5" />
            <span className="text-xs">Module</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => navigate(createPageUrl('APIKeyManagement'))}>
            <Key className="w-5 h-5" />
            <span className="text-xs">API Key</span>
          </Button>
          <RoleImportDialog />
          <SystemReportDialog />
          <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => navigate(createPageUrl('AuditReports'))}>
            <FileText className="w-5 h-5" />
            <span className="text-xs">Audit Report</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => navigate(createPageUrl('ComplianceCenter'))}>
            <Shield className="w-5 h-5" />
            <span className="text-xs">Compliance</span>
          </Button>
        </div>
      </CardContent>
      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </Card>
  );
}