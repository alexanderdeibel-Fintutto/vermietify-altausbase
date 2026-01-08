import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Zap } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BulkOperationsPage() {
  const [selectedItems, setSelectedItems] = useState([]);

  const mockItems = [
    { id: 1, name: 'Gebäude A', type: 'Building', status: 'active' },
    { id: 2, name: 'Mieter - Meyer', type: 'Tenant', status: 'active' },
    { id: 3, name: 'Vertrag 2026-001', type: 'Contract', status: 'pending' },
    { id: 4, name: 'Zahlung - Januar', type: 'Payment', status: 'pending' },
  ];

  const toggleSelect = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedItems(prev => 
      prev.length === mockItems.length ? [] : mockItems.map(i => i.id)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">⚡ Bulk-Operationen</h1>
        <p className="text-slate-600 mt-1">Führen Sie Operationen auf mehreren Einträgen gleichzeitig aus</p>
      </div>

      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Bulk-Operationen können nicht rückgängig gemacht werden. Bitte mit Bedacht verwenden.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Zap className="w-5 h-5" /> Elemente auswählen</span>
            <span className="text-sm font-normal text-slate-600">{selectedItems.length} ausgewählt</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-3 border-b">
              <Checkbox 
                checked={selectedItems.length === mockItems.length}
                onCheckedChange={toggleSelectAll}
              />
              <label className="text-sm font-semibold text-slate-900 cursor-pointer">Alle auswählen</label>
            </div>
            {mockItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg">
                <Checkbox 
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={() => toggleSelect(item.id)}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.type}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-700">{item.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedItems.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Verfügbare Operationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
              ✓ Status aktualisieren
            </Button>
            <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
              📧 Email versenden
            </Button>
            <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
              🏷️ Tags hinzufügen
            </Button>
            <Button variant="destructive" className="w-full justify-start">
              🗑️ Löschen ({selectedItems.length})
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}