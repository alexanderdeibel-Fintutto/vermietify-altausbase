import React from 'react';
import CustomRoleManager from '@/components/admin/CustomRoleManager';
import PermissionDashboard from '@/components/admin/PermissionDashboard';

export default function AdminRoleManagement() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Rollenverwaltung</h1>
        <p className="text-sm text-slate-600 mt-2">
          Erstellen und verwalten Sie benutzerdefinierte Rollen mit spezifischen Berechtigungen
        </p>
      </div>

      {/* Custom Roles */}
      <CustomRoleManager />

      {/* Permissions Overview */}
      <PermissionDashboard />
    </div>
  );
}