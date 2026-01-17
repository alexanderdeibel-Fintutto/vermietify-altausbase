import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfCheckbox } from '@/components/shared/VfCheckbox';
import { Button } from '@/components/ui/button';
import { Users, Mail, UserX } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function BulkUserOperations() {
  const [selectedUsers, setSelectedUsers] = useState([]);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const toggleUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk-Operationen
          {selectedUsers.length > 0 && (
            <span className="vf-badge vf-badge-primary">{selectedUsers.length} ausgewählt</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {selectedUsers.length > 0 && (
            <div className="flex gap-2 p-3 bg-[var(--vf-primary-50)] rounded-lg">
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                E-Mail senden
              </Button>
              <Button variant="outline" size="sm">
                <UserX className="h-4 w-4 mr-2" />
                Deaktivieren
              </Button>
            </div>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 bg-[var(--theme-surface)] rounded-lg">
                <VfCheckbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={() => toggleUser(user.id)}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{user.full_name}</div>
                  <div className="text-xs text-[var(--theme-text-muted)]">{user.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}