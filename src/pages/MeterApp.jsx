import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge, QrCode, Camera, BarChart3, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MeterApp() {
  const { data: meters = [] } = useQuery({
    queryKey: ['all-meters'],
    queryFn: () => base44.entities.Meter.list()
  });

  const { data: recentReadings = [] } = useQuery({
    queryKey: ['recent-readings'],
    queryFn: () => base44.entities.MeterReading.list('-created_date', 10)
  });

  const features = [
    {
      title: 'Zähler erfassen',
      icon: Camera,
      description: 'Neue Zählerstände scannen',
      path: 'MobileMeterScanning',
      color: 'bg-blue-600'
    },
    {
      title: 'QR-Code Scanner',
      icon: QrCode,
      description: 'Zähler per QR identifizieren',
      path: 'MobileMeterScanning',
      color: 'bg-green-600'
    },
    {
      title: 'Zähler verwalten',
      icon: Gauge,
      description: 'Alle Zähler im Überblick',
      path: 'MeterDashboard',
      color: 'bg-purple-600'
    },
    {
      title: 'Auswertungen',
      icon: BarChart3,
      description: 'Verbrauchsanalysen',
      path: 'MeterDashboard',
      color: 'bg-orange-600'
    },
    {
      title: 'Ablesepläne',
      icon: Clock,
      description: 'Turnusmäßige Ablesungen',
      path: 'MeterDashboard',
      color: 'bg-red-600'
    },
    {
      title: 'Rundgänge',
      icon: MapPin,
      description: 'Optimierte Ablese-Routen',
      path: 'MeterDashboard',
      color: 'bg-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Gauge className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Zählerverwaltung</h1>
          <p className="text-slate-600">Digitale Erfassung und Verwaltung aller Zählerstände</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-600">Gesamt Zähler</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">{meters.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-600">Letzte Ablesung</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">{recentReadings.length}</p>
              <p className="text-xs text-slate-600 mt-1">in den letzten 30 Tagen</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-600">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-slate-900">Alle aktuell</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Link key={feature.title} to={createPageUrl(feature.path)}>
              <Card className="hover:shadow-lg transition-all cursor-pointer h-full border-2 border-transparent hover:border-blue-200">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 ${feature.color} rounded-2xl mx-auto mb-4 flex items-center justify-center`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-base mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Letzte Ablesungen</CardTitle>
          </CardHeader>
          <CardContent>
            {recentReadings.length === 0 ? (
              <p className="text-center text-slate-600 py-8">Noch keine Ablesungen erfasst</p>
            ) : (
              <div className="space-y-3">
                {recentReadings.slice(0, 5).map((reading) => (
                  <div key={reading.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">Zähler #{reading.meter_id}</p>
                      <p className="text-sm text-slate-600">
                        {new Date(reading.reading_date || reading.created_date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-blue-600">{reading.reading_value}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}