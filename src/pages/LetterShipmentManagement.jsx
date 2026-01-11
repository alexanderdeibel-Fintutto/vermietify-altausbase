import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Package, CheckCircle2, Clock, AlertCircle, DollarSign, MapPin } from 'lucide-react';

export default function LetterShipmentManagement() {
  const [selectedShipment, setSelectedShipment] = useState(null);

  const { data: shipments = [] } = useQuery({
    queryKey: ['letterShipments'],
    queryFn: () => base44.entities.LetterShipment.list('-sent_at', 100),
  });

  const statusConfig = {
    queue: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'In Warteschlange' },
    hold: { icon: AlertCircle, color: 'bg-orange-100 text-orange-800', label: 'Paused' },
    done: { icon: CheckCircle2, color: 'bg-blue-100 text-blue-800', label: 'Gedruckt' },
    sent: { icon: Package, color: 'bg-green-100 text-green-800', label: 'Versendet' },
    canceled: { icon: AlertCircle, color: 'bg-red-100 text-red-800', label: 'Storniert' },
  };

  const stats = {
    total: shipments.length,
    sent: shipments.filter(s => s.status === 'sent').length,
    pending: shipments.filter(s => ['queue', 'done'].includes(s.status)).length,
    costs: shipments.reduce((sum, s) => sum + (s.cost_gross || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Briefe-Verwaltung</h1>
          <p className="text-slate-600 font-light mt-2">Übersicht aller LetterXpress-Versände</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-600">Gesamt</p>
                <p className="text-2xl font-semibold mt-1">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-slate-300" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-600">Versendet</p>
                <p className="text-2xl font-semibold mt-1">{stats.sent}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-600">Ausstehend</p>
                <p className="text-2xl font-semibold mt-1">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-600">Kosten (Brutto)</p>
                <p className="text-2xl font-semibold mt-1">{stats.costs.toFixed(2)}€</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Alle ({shipments.length})</TabsTrigger>
          <TabsTrigger value="sent">Versendet ({stats.sent})</TabsTrigger>
          <TabsTrigger value="pending">Ausstehend ({stats.pending})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-3">
          {shipments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-slate-500">
                Keine Briefe vorhanden
              </CardContent>
            </Card>
          ) : (
            shipments.map(shipment => {
              const config = statusConfig[shipment.status];
              const StatusIcon = config.icon;
              return (
                <Card
                  key={shipment.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedShipment(shipment.id === selectedShipment ? null : shipment.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${config.color}`}>
                            <StatusIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-900">{shipment.recipient_name}</h3>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {shipment.recipient_address}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-900">{shipment.cost_gross}€</p>
                        <p className="text-xs text-slate-600">{shipment.pages} Seiten</p>
                      </div>
                    </div>

                    {selectedShipment === shipment.id && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-600">Dokumenttyp</p>
                            <p className="font-medium">{shipment.document_type}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600">Versandart</p>
                            <p className="font-medium">{shipment.shipping_type === 'normal' ? 'Standard' : 'Express'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600">Farbe</p>
                            <p className="font-medium">{shipment.color === '4' ? 'Farbdruck' : 'S/W'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600">Status</p>
                            <p className="font-medium">{config.label}</p>
                          </div>
                          {shipment.tracking_code && (
                            <div className="col-span-2">
                              <p className="text-xs text-slate-600">Tracking</p>
                              <p className="font-mono text-sm">{shipment.tracking_code}</p>
                            </div>
                          )}
                          {shipment.sent_at && (
                            <div className="col-span-2">
                              <p className="text-xs text-slate-600">Versendet am</p>
                              <p className="font-medium">{new Date(shipment.sent_at).toLocaleDateString('de-DE')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-6 space-y-3">
          {shipments
            .filter(s => s.status === 'sent')
            .map(shipment => (
              <Card key={shipment.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{shipment.recipient_name}</h3>
                      <p className="text-xs text-slate-600 mt-1">{shipment.tracking_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{shipment.cost_gross}€</p>
                      <p className="text-xs text-slate-600">{new Date(shipment.sent_at).toLocaleDateString('de-DE')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="pending" className="mt-6 space-y-3">
          {shipments
            .filter(s => ['queue', 'done'].includes(s.status))
            .map(shipment => (
              <Card key={shipment.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{shipment.recipient_name}</h3>
                      <p className="text-xs text-slate-600 mt-1">{shipment.recipient_address}</p>
                    </div>
                    <Button size="sm" variant="outline">Abbrechen</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}