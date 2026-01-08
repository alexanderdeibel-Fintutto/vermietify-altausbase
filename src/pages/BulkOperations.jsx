import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Mail, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkOperations() {
  const [selectedEntity, setSelectedEntity] = useState('Building');
  const [selectedItems, setSelectedItems] = useState([]);
  const [operation, setOperation] = useState('delete');

  const entities = [
    { value: 'Building', label: 'Objekte' },
    { value: 'Unit', label: 'Einheiten' },
    { value: 'Tenant', label: 'Mieter' },
    { value: 'LeaseContract', label: 'Verträge' },
    { value: 'FinancialItem', label: 'Finanzposten' },
    { value: 'Task', label: 'Aufgaben' },
    { value: 'Document', label: 'Dokumente' }
  ];

  const { data: items = [], refetch } = useQuery({
    queryKey: ['bulk-items', selectedEntity],
    queryFn: () => base44.entities[selectedEntity].list()
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ operation, itemIds }) => {
      const results = [];
      
      for (const id of itemIds) {
        try {
          if (operation === 'delete') {
            await base44.entities[selectedEntity].delete(id);
          } else if (operation === 'update') {
            await base44.entities[selectedEntity].update(id, { status: 'archived' });
          }
          results.push({ id, success: true });
        } catch (error) {
          results.push({ id, success: false, error: error.message });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      toast.success(`${successCount} von ${results.length} Operationen erfolgreich`);
      setSelectedItems([]);
      refetch();
    }
  });

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(i => i.id));
    }
  };

  const handleItemToggle = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleExecute = () => {
    if (selectedItems.length === 0) {
      toast.error('Keine Items ausgewählt');
      return;
    }

    const confirmed = window.confirm(
      `${selectedItems.length} Items ${operation === 'delete' ? 'löschen' : 'aktualisieren'}?`
    );

    if (confirmed) {
      bulkMutation.mutate({ operation, itemIds: selectedItems });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-slate-900">Bulk-Operationen</h1>
        <p className="text-slate-600">Mehrere Datensätze gleichzeitig bearbeiten</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { value: items.length, label: "Verfügbare Items", color: "slate" },
          { value: selectedItems.length, label: "Ausgewählt", color: "blue" },
          { value: `${((selectedItems.length / items.length) * 100 || 0).toFixed(0)}%`, label: "Auswahlrate", color: "green" }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
          >
        <Card>
          <CardContent className="p-6">
            <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
            <div className="text-sm text-slate-600">{stat.label}</div>
          </CardContent>
        </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bulk-Aktion konfigurieren</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Entity</label>
              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {entities.map(entity => (
                    <SelectItem key={entity.value} value={entity.value}>
                      {entity.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Operation</label>
              <Select value={operation} onValueChange={setOperation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delete">Löschen</SelectItem>
                  <SelectItem value="update">Status ändern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleExecute}
                disabled={selectedItems.length === 0 || bulkMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Ausführen ({selectedItems.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Items auswählen</CardTitle>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedItems.length === items.length ? 'Alle abwählen' : 'Alle auswählen'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {items.map((item) => (
              <div 
                key={item.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50"
              >
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={() => handleItemToggle(item.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {item.name || item.title || item.address || item.file_name || `Item ${item.id.slice(0, 8)}`}
                  </div>
                  <div className="text-sm text-slate-600">ID: {item.id.slice(0, 16)}...</div>
                </div>
                {item.status && (
                  <Badge variant="outline">{item.status}</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}