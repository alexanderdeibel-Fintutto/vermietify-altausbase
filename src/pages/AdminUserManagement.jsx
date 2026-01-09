import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserRoleManager from '@/components/admin/UserRoleManager';
import DepartmentManager from '@/components/admin/DepartmentManager';
import UserAuditLogViewer from '@/components/admin/UserAuditLogViewer';
import UserPermissionsMatrix from '@/components/admin/UserPermissionsMatrix';

export default function AdminUserManagement() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-light">Benutzerverwaltung</h1>
        <p className="text-slate-600 text-sm mt-1">
          Rollen, Berechtigungen, Teams und Audit-Logs verwalten
        </p>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles">Rollen & Berechtigungen</TabsTrigger>
          <TabsTrigger value="departments">Teams & Abteilungen</TabsTrigger>
          <TabsTrigger value="matrix">Berechtigungsmatrix</TabsTrigger>
          <TabsTrigger value="audit">Audit-Log</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Benutzerrollen verwalten</CardTitle>
            </CardHeader>
            <CardContent>
              <UserRoleManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Teams und Abteilungen</CardTitle>
            </CardHeader>
            <CardContent>
              <DepartmentManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Benutzer-Rollen-Berechtigungen Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <UserPermissionsMatrix />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aktivitäts-Audit-Log</CardTitle>
            </CardHeader>
            <CardContent>
              <UserAuditLogViewer />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-base">Wichtige Hinweise</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-2">
          <p>• <span className="font-semibold">Rollen:</span> Definieren Sie benutzerdefinierte Rollen mit spezifischen Berechtigungen für verschiedene Benutzergruppen.</p>
          <p>• <span className="font-semibold">Teams/Abteilungen:</span> Organisieren Sie Benutzer in Abteilungen und gewähren Sie rollenbasierte Zugriffe auf Daten.</p>
          <p>• <span className="font-semibold">Audit-Trail:</span> Alle Benutzeraktivitäten werden protokolliert für Compliance- und Sicherheitszwecke.</p>
        </CardContent>
      </Card>
    </div>
  );
}