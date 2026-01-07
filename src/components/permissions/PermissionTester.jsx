import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Play } from 'lucide-react';

export default function PermissionTester() {
  const [userId, setUserId] = useState('');
  const [module, setModule] = useState('');
  const [resource, setResource] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState(null);

  const testMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('checkUserPermission', data);
      return response.data;
    },
    onSuccess: (data) => {
      setResult(data);
    }
  });

  const handleTest = () => {
    testMutation.mutate({ userId, module, resource, action });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Tester</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>User ID</Label>
              <Input 
                value={userId} 
                onChange={(e) => setUserId(e.target.value)}
                placeholder="user_123..."
              />
            </div>
            <div>
              <Label>Modul</Label>
              <Select value={module} onValueChange={setModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Modul wählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property">property</SelectItem>
                  <SelectItem value="finance">finance</SelectItem>
                  <SelectItem value="documents">documents</SelectItem>
                  <SelectItem value="tenants">tenants</SelectItem>
                  <SelectItem value="tax_rental">tax_rental</SelectItem>
                  <SelectItem value="communication">communication</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ressource</Label>
              <Input 
                value={resource} 
                onChange={(e) => setResource(e.target.value)}
                placeholder="z.B. buildings, contracts"
              />
            </div>
            <div>
              <Label>Aktion</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Aktion wählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">read</SelectItem>
                  <SelectItem value="write">write</SelectItem>
                  <SelectItem value="delete">delete</SelectItem>
                  <SelectItem value="execute">execute</SelectItem>
                  <SelectItem value="all">all</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleTest} 
            disabled={testMutation.isPending || !userId || !module || !resource || !action}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            Test ausführen
          </Button>

          {result && (
            <div className={`p-4 border rounded-lg ${
              result.hasPermission 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {result.hasPermission ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-semibold">
                  {result.hasPermission ? 'Zugriff gewährt' : 'Zugriff verweigert'}
                </span>
              </div>
              
              {result.matchedPermissions && result.matchedPermissions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Passende Berechtigungen:</div>
                  <div className="flex flex-wrap gap-2">
                    {result.matchedPermissions.map((perm, idx) => (
                      <Badge key={idx} variant="outline">
                        {perm.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}