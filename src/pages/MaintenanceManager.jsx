import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';

export default function MaintenanceManagerPage() {
  const tickets = [
    { id: 1, title: 'Leckendes Badezimmerdach', property: 'Wohnung 2B', priority: 'high', status: 'open', reported: '08.01.2026', assigned: 'Max Müller' },
    { id: 2, title: 'Heizung defekt', property: 'Wohnung 1A', priority: 'critical', status: 'in_progress', reported: '07.01.2026', assigned: 'Klaus Schmidt' },
    { id: 3, title: 'Türschloss reparieren', property: 'Haupteingang', priority: 'medium', status: 'scheduled', reported: '05.01.2026', assigned: 'Pending' },
    { id: 4, title: 'Fenster abdichten', property: 'Wohnung 3C', priority: 'low', status: 'completed', reported: '02.01.2026', assigned: 'Max Müller' },
  ];

  const stats = [
    { label: 'Offene Tickets', value: '8' },
    { label: 'Im Fortschritt', value: '3' },
    { label: 'Diese Woche fällig', value: '5' },
    { label: 'Abgeschlossen', value: '12' },
  ];

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-slate-600';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'open': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🔧 Wartungsmanagement</h1>
          <p className="text-slate-600 mt-1">Verwalten Sie Wartungs- und Reparaturaufträge</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Neues Ticket</Button>
      </div>

      <QuickStats stats={stats} accentColor="orange" />

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="open">Offen</TabsTrigger>
          <TabsTrigger value="progress">In Bearbeitung</TabsTrigger>
          <TabsTrigger value="completed">Abgeschlossen</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="border border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(ticket.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{ticket.title}</h3>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{ticket.property} • {ticket.reported} • {ticket.assigned}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Details</Button>
                    {ticket.status !== 'completed' && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Update</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}