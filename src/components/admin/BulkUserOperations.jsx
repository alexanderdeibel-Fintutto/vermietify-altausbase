import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfCheckbox } from '@/components/shared/VfCheckbox';
import { Button } from '@/components/ui/button';
import { Users, Mail, Shield } from 'lucide-react';

export default function BulkUserOperations() {
  const [selectedUsers, setSelectedUsers] = useState([]);

  const users = [
    { id: 1, name: 'Max Mustermann', email: 'max@example.com', role: 'user' },
    { id: 2, name: 'Anna Schmidt', email: 'anna@example.com', role: 'admin' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk-Operationen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-3 bg-[var(--theme-surface)] rounded-lg">
              <VfCheckbox
                checked={selectedUsers.includes(user.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedUsers([...selectedUsers, user.id]);
                  } else {
                    setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                  }
                }}
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{user.name}</div>
                <div className="text-xs text-[var(--theme-text-muted)]">{user.email}</div>
              </div>
            </div>
          ))}
        </div>

        {selectedUsers.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Mail className="h-4 w-4 mr-2" />
              E-Mail senden
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Shield className="h-4 w-4 mr-2" />
              Rolle ändern
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}