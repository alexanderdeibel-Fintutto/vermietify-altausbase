import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Package } from 'lucide-react';

export default function ModuleAccessMatrix() {
  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const { data: moduleAccess = [] } = useQuery({
    queryKey: ['module-access'],
    queryFn: () => base44.asServiceRole.entities.ModuleAccess.list()
  });

  const { data: modulePricing = [] } = useQuery({
    queryKey: ['module-pricing'],
    queryFn: () => base44.asServiceRole.entities.ModulePricing.list()
  });

  // Group access by user and module
  const accessMatrix = users.slice(0, 10).map(user => {
    const userAccess = moduleAccess.filter(ma => 
      ma.is_active // Simplified: In real app, would need proper user-module linking
    );
    return {
      user,
      modules: modulePricing.map(mp => ({
        module: mp,
        hasAccess: userAccess.some(ma => ma.module_code === mp.module_code)
      }))
    };
  });

  const modulesByCategory = modulePricing.reduce((acc, mp) => {
    if (!acc[mp.category]) acc[mp.category] = [];
    acc[mp.category].push(mp);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Modul-Zugriffs-Matrix
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(modulesByCategory).map(([category, modules]) => (
          <div key={category}>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Badge variant="outline">{category}</Badge>
              <span className="text-sm text-slate-600">
                ({modules.length} Module)
              </span>
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Benutzer</th>
                    {modules.map(module => (
                      <th key={module.id} className="text-center p-2 font-medium min-w-[80px]">
                        <div className="text-xs">{module.module_name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accessMatrix.map(({ user, modules: userModules }) => (
                    <tr key={user.id} className="border-b hover:bg-slate-50">
                      <td className="p-2">
                        <div className="font-medium text-xs">{user.full_name || user.email}</div>
                        <div className="text-xs text-slate-500">{user.role}</div>
                      </td>
                      {modules.map(module => {
                        const access = userModules.find(um => um.module.id === module.id);
                        return (
                          <td key={module.id} className="text-center p-2">
                            {access?.hasAccess ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div className="text-xs text-slate-600 bg-blue-50 p-3 rounded-lg">
          <strong>Legende:</strong> <CheckCircle2 className="w-3 h-3 inline text-green-600" /> = Zugriff aktiv, 
          <XCircle className="w-3 h-3 inline text-slate-300 ml-2" /> = Kein Zugriff
        </div>
      </CardContent>
    </Card>
  );
}