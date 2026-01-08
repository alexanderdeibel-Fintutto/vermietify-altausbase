import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, Play, AlertCircle, CheckCircle } from 'lucide-react';

export default function BulkOperationsPage() {
  const [selectedOps, setSelectedOps] = useState([]);

  const operations = [
    { id: 1, name: 'Mietanpassung Q1 2026', type: 'update', items: 24, status: 'pending', impact: 'high' },
    { id: 2, name: 'Massenhaft Mieterbenachrichtigungen', type: 'email', items: 45, status: 'pending', impact: 'medium' },
    { id: 3, name: 'Nebenkosten abrechnen', type: 'calculation', items: 8, status: 'in_progress', impact: 'critical' },
    { id: 4, name: 'Dokumente archivieren', type: 'archive', items: 156, status: 'completed', impact: 'low' },
  ];

  const toggleOp = (id) => {
    setSelectedOps(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">⚡ Massenvorgänge</h1>
          <p className="text-slate-600 mt-1">Führen Sie mehrere Operationen gleichzeitig durch</p>
        </div>
        <Button disabled={selectedOps.length === 0} className="bg-violet-600 hover:bg-violet-700">
          <Play className="w-4 h-4 mr-2" />Ausführen ({selectedOps.length})
        </Button>
      </div>

      <div className="space-y-3">
        {operations.map((op) => (
          <Card key={op.id} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {op.status !== 'completed' && (
                  <Checkbox 
                    checked={selectedOps.includes(op.id)}
                    onCheckedChange={() => toggleOp(op.id)}
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Zap className="w-5 h-5 text-violet-600" />
                    <h3 className="font-semibold text-slate-900">{op.name}</h3>
                    <Badge className={
                      op.impact === 'critical' ? 'bg-red-600' :
                      op.impact === 'high' ? 'bg-orange-600' :
                      op.impact === 'medium' ? 'bg-yellow-600' :
                      'bg-blue-600'
                    }>
                      {op.impact.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    {op.type.toUpperCase()} • {op.items} Einträge
                  </p>
                </div>
                <div>
                  {op.status === 'completed' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : op.status === 'in_progress' ? (
                    <div className="animate-spin"><Zap className="w-6 h-6 text-violet-600" /></div>
                  ) : (
                    <Badge variant="outline">Ausstehend</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-amber-200 bg-amber-50">
        <CardContent className="pt-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">Massenvorgänge können nicht rückgängig gemacht werden. Stellen Sie sicher, dass Sie alle Einstellungen überprüft haben.</p>
        </CardContent>
      </Card>
    </div>
  );
}