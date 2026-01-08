import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function PermissionTester() {
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('read');
  const [resource, setResource] = useState('buildings');
  const [result, setResult] = useState(null);

  const testMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('checkUserPermission', {
        userId,
        action,
        resource
      });
      return response.data;
    },
    onSuccess: (data) => {
      setResult(data);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">User ID</label>
            <Input
              placeholder="user-id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Action</label>
            <Input
              placeholder="read, write, delete"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Resource</label>
            <Input
              placeholder="buildings, contracts, etc."
              value={resource}
              onChange={(e) => setResource(e.target.value)}
            />
          </div>
        </div>

        <Button 
          onClick={() => testMutation.mutate()} 
          disabled={!userId || testMutation.isPending}
          className="w-full"
        >
          {testMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing...</>
          ) : (
            'Test Permission'
          )}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.hasPermission 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {result.hasPermission ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <span className="font-semibold">
                {result.hasPermission ? 'Permission Granted' : 'Permission Denied'}
              </span>
            </div>
            
            {result.details && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Grund: </span>
                  {result.details.reason}
                </div>
                {result.details.matchedPermissions && (
                  <div>
                    <span className="font-medium">Berechtigungen: </span>
                    {result.details.matchedPermissions.map((perm, idx) => (
                      <Badge key={idx} variant="secondary" className="ml-1">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}