import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

const statusConfig = {
  pending: { label: 'Ausstehend', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  sent: { label: 'Versendet', icon: Send, color: 'text-blue-600 bg-blue-50' },
  delivered: { label: 'Zugestellt', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  failed: { label: 'Fehlgeschlagen', icon: AlertCircle, color: 'text-red-600 bg-red-50' }
};

const typeConfig = {
  letter: 'Standardbrief',
  registered: 'Einschreiben',
  color: 'Farbdruck',
  express: 'Express'
};

export default function PostausgangsbuchTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);

  const { data: shipments = [], isLoading, refetch, error } = useQuery({
    queryKey: ['letterShipments'],
    queryFn: async () => {
      try {
        return await base44.entities.LetterShipment.list('-sent_date', 100);
      } catch (err) {
        console.error('Error loading shipments:', err);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      console.log('[PostausgangsbuchTable] Calling letterxpressSync...');
      const response = await base44.functions.invoke('letterxpressSync', {});
      console.log('[PostausgangsbuchTable] Response:', response);
      console.log('[PostausgangsbuchTable] Response.data:', response.data);
      
      if (response.data?.success) {
        console.log('[PostausgangsbuchTable] Success! Refreshing...');
        refetch();
        toast.success(response.data?.message || 'Synchronisiert');
      } else {
        console.log('[PostausgangsbuchTable] No success flag');
        toast.error(response.data?.message || 'Fehler beim Synchronisieren');
      }
    } catch (error) {
      console.error('[PostausgangsbuchTable] Sync error:', error);
      const message = error.response?.data?.message || error.message || 'Netzwerkfehler';
      toast.error('Fehler: ' + message);
    } finally {
      setSyncing(false);
    }
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = !searchTerm || 
      shipment.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.tracking_number?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Postausgangsbuch</CardTitle>
            <p className="text-sm text-slate-600 mt-1">Alle versendeten Briefe und ihre Status</p>
          </div>
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="gap-2"
            variant="outline"
          >
            <RefreshCw className="w-4 h-4" />
            {syncing ? 'Synchronisiere...' : 'Synchronisieren'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filter & Search */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Nach Empfänger oder Tracking-Nummer suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Alle Status</option>
            <option value="pending">Ausstehend</option>
            <option value="sent">Versendet</option>
            <option value="delivered">Zugestellt</option>
            <option value="failed">Fehlgeschlagen</option>
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Laden...</div>
        ) : filteredShipments.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            {shipments.length === 0 ? 'Noch keine Versände vorhanden' : 'Keine Treffer'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left p-3 font-medium">Empfänger</th>
                  <th className="text-left p-3 font-medium">Adresse</th>
                  <th className="text-left p-3 font-medium">Typ</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Versendet</th>
                  <th className="text-left p-3 font-medium">Kosten</th>
                  <th className="text-left p-3 font-medium">Tracking</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map((shipment) => {
                  const statusInfo = statusConfig[shipment.status] || statusConfig.pending;
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={shipment.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-900">{shipment.recipient_name}</td>
                      <td className="p-3 text-slate-600 text-xs">{shipment.recipient_address}</td>
                      <td className="p-3 text-slate-600">{typeConfig[shipment.shipment_type] || shipment.shipment_type}</td>
                      <td className="p-3">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">
                        {shipment.sent_date 
                          ? format(new Date(shipment.sent_date), 'dd.MM.yyyy', { locale: de })
                          : '-'
                        }
                      </td>
                      <td className="p-3 font-medium">€ {shipment.cost?.toFixed(2) || '0,00'}</td>
                      <td className="p-3 text-slate-600 font-mono text-xs">
                        {shipment.tracking_number || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats */}
        {shipments.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
            <div>
              <p className="text-xs text-slate-600">Gesamt Versände</p>
              <p className="text-xl font-semibold text-slate-900">{shipments.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Zugestellt</p>
              <p className="text-xl font-semibold text-green-600">
                {shipments.filter(s => s.status === 'delivered').length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Gesamtkosten</p>
              <p className="text-xl font-semibold text-slate-900">
                € {shipments.reduce((sum, s) => sum + (s.cost || 0), 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Fehlerquote</p>
              <p className="text-xl font-semibold text-red-600">
                {((shipments.filter(s => s.status === 'failed').length / shipments.length) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}