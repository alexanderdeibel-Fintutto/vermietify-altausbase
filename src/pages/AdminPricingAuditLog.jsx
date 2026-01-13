import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';

export default function AdminPricingAuditLog() {
  const [expandedIds, setExpandedIds] = useState([]);
  const [filterEntity, setFilterEntity] = useState('ALL');
  const [filterAction, setFilterAction] = useState('ALL');

  const { data: logs = [] } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.PricingAuditLog.list('-created_date', 100)
  });

  const filteredLogs = logs.filter(log => {
    if (filterEntity !== 'ALL' && log.data.entity_type !== filterEntity) return false;
    if (filterAction !== 'ALL' && log.data.action !== filterAction) return false;
    return true;
  });

  const toggleExpand = (id) => {
    if (expandedIds.includes(id)) {
      setExpandedIds(expandedIds.filter(eid => eid !== id));
    } else {
      setExpandedIds([...expandedIds, id]);
    }
  };

  const getActionBadge = (action) => {
    const variants = {
      CREATE: 'default',
      UPDATE: 'secondary',
      DELETE: 'destructive',
      ACTIVATE: 'default',
      DEACTIVATE: 'outline'
    };
    return <Badge variant={variants[action] || 'outline'}>{action}</Badge>;
  };

  const exportCSV = () => {
    const csv = [
      ['Zeitpunkt', 'Entity-Typ', 'Entity-ID', 'Aktion', 'Feld', 'Alt', 'Neu', 'User', 'Grund'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_date).toLocaleString('de-DE'),
        log.data.entity_type,
        log.data.entity_id,
        log.data.action,
        log.data.field_name || '',
        log.data.old_value || '',
        log.data.new_value || '',
        log.data.changed_by,
        log.data.reason || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Änderungsprotokoll</h1>
          <p className="text-slate-600 mt-1">Alle Änderungen am Pricing-System</p>
        </div>
        <Button onClick={exportCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Als CSV
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Entity-Typ</Label>
              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Alle</SelectItem>
                  <SelectItem value="PRODUCT">Produkte</SelectItem>
                  <SelectItem value="FEATURE">Features</SelectItem>
                  <SelectItem value="TIER">Tarife</SelectItem>
                  <SelectItem value="BUNDLE">Bundles</SelectItem>
                  <SelectItem value="DISCOUNT">Rabatte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Aktion</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Alle</SelectItem>
                  <SelectItem value="CREATE">Erstellt</SelectItem>
                  <SelectItem value="UPDATE">Geändert</SelectItem>
                  <SelectItem value="DELETE">Gelöscht</SelectItem>
                  <SelectItem value="ACTIVATE">Aktiviert</SelectItem>
                  <SelectItem value="DEACTIVATE">Deaktiviert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log-Einträge */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">
            {filteredLogs.length} Einträge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredLogs.map(log => {
              const isExpanded = expandedIds.includes(log.id);
              
              return (
                <div key={log.id} className="border rounded-lg">
                  <button
                    onClick={() => toggleExpand(log.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 grid grid-cols-4 gap-4 text-left">
                      <div className="text-sm text-slate-500">
                        {new Date(log.created_date).toLocaleString('de-DE')}
                      </div>
                      <div className="text-sm">
                        <Badge variant="outline">{log.data.entity_type}</Badge>
                      </div>
                      <div>
                        {getActionBadge(log.data.action)}
                      </div>
                      <div className="text-sm text-slate-600">
                        {log.data.changed_by}
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="p-4 border-t bg-slate-50 space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500">Entity-ID:</span> {log.data.entity_id}
                        </div>
                        {log.data.field_name && (
                          <div>
                            <span className="text-slate-500">Feld:</span> {log.data.field_name}
                          </div>
                        )}
                        {log.data.old_value && (
                          <div className="col-span-2">
                            <span className="text-slate-500">Alt:</span>
                            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto">
                              {log.data.old_value}
                            </pre>
                          </div>
                        )}
                        {log.data.new_value && (
                          <div className="col-span-2">
                            <span className="text-slate-500">Neu:</span>
                            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto">
                              {log.data.new_value}
                            </pre>
                          </div>
                        )}
                        {log.data.reason && (
                          <div className="col-span-2">
                            <span className="text-slate-500">Grund:</span> {log.data.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                Keine Einträge gefunden
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Snapshots */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">Snapshots</CardTitle>
          <CardDescription>Wiederherstellungspunkte der Konfiguration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              placeholder="Snapshot-Name"
            />
            <Input
              value={snapshotDesc}
              onChange={(e) => setSnapshotDesc(e.target.value)}
              placeholder="Beschreibung (optional)"
            />
          </div>
          
          <Button
            onClick={() => snapshotMutation.mutate()}
            disabled={!snapshotName || snapshotMutation.isPending}
            className="w-full"
          >
            <Camera className="w-4 h-4 mr-2" />
            Snapshot erstellen
          </Button>

          <div className="space-y-2 mt-6">
            {snapshots.map(snapshot => (
              <div key={snapshot.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-light">{snapshot.data.snapshot_name}</div>
                  <div className="text-sm text-slate-500">
                    {new Date(snapshot.created_date).toLocaleDateString('de-DE')} • {snapshot.created_by}
                  </div>
                  {snapshot.data.description && (
                    <div className="text-sm text-slate-600 mt-1">{snapshot.data.description}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm('Snapshot wirklich löschen?')) {
                      deleteSnapshotMutation.mutate(snapshot.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            ))}

            {snapshots.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                Noch keine Snapshots vorhanden
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}