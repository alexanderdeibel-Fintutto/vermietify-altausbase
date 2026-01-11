import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function LetterXpressManagement() {
  const [activeTab, setActiveTab] = useState('overview');

  const shipments = [
    { id: 1, count: 5, status: 'delivered', date: '2026-01-10', cost: 15.50 },
    { id: 2, count: 3, status: 'in_transit', date: '2026-01-09', cost: 9.30 },
    { id: 3, count: 7, status: 'pending', date: '2026-01-11', cost: 21.70 },
  ];

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_transit': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default: return null;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'delivered': 'Zugestellt',
      'in_transit': 'Unterwegs',
      'pending': 'Ausstehend'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Postversand (LetterXpress)</h1>
          <p className="text-slate-600 font-light mt-2">Verwalten Sie den physischen Postversand zu Mietern</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Send className="w-4 h-4 mr-2" />
          Neuer Versand
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Diese Woche versendet</p>
            <p className="text-2xl font-semibold mt-2">15 Briefe</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Gesamtkosten</p>
            <p className="text-2xl font-semibold mt-2">€46,50</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Ausstehend</p>
            <p className="text-2xl font-semibold mt-2">7 Briefe</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Durchschnitt pro Brief</p>
            <p className="text-2xl font-semibold mt-2">€3,10</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="history">Verlauf</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>

        {/* Übersicht */}
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Aktive Versände</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {shipments.map(ship => (
                <div key={ship.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">{ship.count} Briefe</p>
                      <p className="text-xs text-slate-500">{ship.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium text-sm">€{ship.cost.toFixed(2)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {getStatusIcon(ship.status)}
                        <span className="text-xs text-slate-600">{getStatusLabel(ship.status)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verlauf */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Versandverlauf</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Detaillierter Verlauf aller Versände</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Einstellungen */}
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>LetterXpress-Einstellungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">LetterXpress API ist nicht verbunden</p>
              </div>
              <Button className="w-full">LetterXpress verbinden</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}