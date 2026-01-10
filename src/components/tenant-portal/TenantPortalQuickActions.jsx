import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, BookOpen, Upload, MessageSquare } from 'lucide-react';

export default function TenantPortalQuickActions({ onTabChange }) {
  const quickActions = [
    {
      icon: AlertCircle,
      label: 'Störung melden',
      description: 'Problem mit IoT-Sensoren verknüpfen',
      color: 'red',
      tab: 'maintenance'
    },
    {
      icon: Upload,
      label: 'Dokument hochladen',
      description: 'An Mietvertrag anhängen',
      color: 'blue',
      tab: 'documents'
    },
    {
      icon: BookOpen,
      label: 'FAQ durchsuchen',
      description: 'Antworten auf häufige Fragen',
      color: 'green',
      tab: 'help'
    },
    {
      icon: MessageSquare,
      label: 'Nachricht senden',
      description: 'Verwaltung kontaktieren',
      color: 'purple',
      tab: 'messages'
    }
  ];

  const colorClasses = {
    red: 'bg-red-100 text-red-600 hover:bg-red-200',
    blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
    green: 'bg-green-100 text-green-600 hover:bg-green-200',
    purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Schnellzugriff</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => onTabChange(action.tab)}
              className={`p-4 rounded-lg text-left transition-colors ${colorClasses[action.color]}`}
            >
              <action.icon className="w-6 h-6 mb-2" />
              <p className="text-sm font-semibold">{action.label}</p>
              <p className="text-xs opacity-80 mt-1">{action.description}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}