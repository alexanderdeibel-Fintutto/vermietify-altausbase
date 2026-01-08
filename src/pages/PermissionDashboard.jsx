import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Key, Lock } from 'lucide-react';
import PermissionTester from '@/components/permissions/PermissionTester';

export default function PermissionDashboard() {
  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.asServiceRole.entities.Permission.list()
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.asServiceRole.entities.Role.list()
  });

  const { data: roleAssignments = [] } = useQuery({
    queryKey: ['role-assignments'],
    queryFn: () => base44.asServiceRole.entities.UserRoleAssignment.list()
  });

  const { data: fieldPermissions = [] } = useQuery({
    queryKey: ['field-permissions'],
    queryFn: () => base44.asServiceRole.entities.FieldPermission.list()
  });

  const permissionsByModule = permissions.reduce((acc, perm) => {
    const module = perm.module || 'other';
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Permission Dashboard</h1>
          <p className="text-slate-600">Berechtigungssystem überwachen und testen</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Shield, label: "Permissions", value: permissions.length, color: "blue" },
          { icon: Users, label: "Rollen", value: roles.length, color: "purple" },
          { icon: Key, label: "Zuweisungen", value: roleAssignments.length, color: "green" },
          { icon: Lock, label: "Feld-Permissions", value: fieldPermissions.length, color: "orange" }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
          >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color !== 'blue' ? `text-${stat.color}-600` : ''}`}>
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
            </div>
          </CardContent>
        </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules">Nach Modul</TabsTrigger>
          <TabsTrigger value="tester">Permission Tester</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4 mt-6">
          {Object.entries(permissionsByModule).map(([module, perms]) => (
            <Card key={module}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{module}</span>
                  <Badge>{perms.length} Permissions</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {perms.map(perm => (
                    <div key={perm.id} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">{perm.name}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        {perm.resource} • {perm.action}
                      </div>
                      <Badge variant="outline" className="text-xs mt-2">
                        {perm.code}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="tester" className="mt-6">
          <PermissionTester />
        </TabsContent>
      </Tabs>
      </motion.div>
    </div>
  );
}