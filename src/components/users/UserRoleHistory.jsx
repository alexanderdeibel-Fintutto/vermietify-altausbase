import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function UserRoleHistory({ userId }) {
  const { data: assignments = [] } = useQuery({
    queryKey: ['role-assignments', userId],
    queryFn: () => base44.asServiceRole.entities.UserRoleAssignment.filter({ user_id: userId })
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.asServiceRole.entities.Role.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const enrichedAssignments = assignments.map(assignment => ({
    ...assignment,
    role: roles.find(r => r.id === assignment.role_id),
    assignedBy: users.find(u => u.id === assignment.assigned_by)
  })).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Rollen-Historie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {enrichedAssignments.map(assignment => (
            <div key={assignment.id} className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-slate-500" />
                  <span className="font-medium">{assignment.role?.name || 'Unknown Role'}</span>
                  <Badge variant={assignment.is_active ? 'default' : 'secondary'}>
                    {assignment.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
                <div className="text-sm text-slate-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    <span>Zugewiesen von: {assignment.assignedBy?.full_name || assignment.assignedBy?.email || 'Unknown'}</span>
                  </div>
                  <div>
                    Gültig: {format(new Date(assignment.valid_from), 'dd.MM.yyyy', { locale: de })}
                    {assignment.valid_until && ` - ${format(new Date(assignment.valid_until), 'dd.MM.yyyy', { locale: de })}`}
                  </div>
                  {assignment.building_restrictions && (
                    <div className="text-xs text-amber-600">
                      Eingeschränkt auf {assignment.building_restrictions.length} Gebäude
                    </div>
                  )}
                  {assignment.notes && (
                    <div className="text-xs italic">{assignment.notes}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {enrichedAssignments.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Keine Rollen-Historie vorhanden
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}