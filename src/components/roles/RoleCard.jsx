import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, Shield } from 'lucide-react';

export default function RoleCard({ role, userCount, onEdit, onToggle, disabled }) {
  const categoryColors = {
    admin: 'bg-red-100 text-red-800',
    mitarbeiter: 'bg-blue-100 text-blue-800',
    extern: 'bg-purple-100 text-purple-800',
    dienstleister: 'bg-orange-100 text-orange-800',
    testing: 'bg-green-100 text-green-800',
    custom: 'bg-slate-100 text-slate-800'
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <div className="font-medium">{role.name}</div>
              <div className="text-sm text-slate-600 mt-1">{role.description}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {role.is_predefined ? (
              <Badge variant="secondary" className="text-xs">System</Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Custom</Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(role.id)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className={categoryColors[role.category]}>
              {role.category}
            </Badge>
            <div className="text-sm text-slate-600">
              {role.permissions?.length || 0} Berechtigungen
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <div className="text-slate-600">
              {userCount} Benutzer
            </div>
            <Switch 
              checked={role.is_active}
              onCheckedChange={(checked) => onToggle(role.id, checked)}
              disabled={role.is_predefined || disabled}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}