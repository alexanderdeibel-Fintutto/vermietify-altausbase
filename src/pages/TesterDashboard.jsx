import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Play, RotateCcw, MessageCircle, BarChart3, Clock } from 'lucide-react';

export default function TesterDashboard() {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Fetch tester account
  const { data: testAccount } = useQuery({
    queryKey: ['testAccount'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return null;
      
      const accounts = await base44.entities.TestAccount.filter({ tester_id: user.id });
      return accounts[0];
    }
  });

  // Fetch activity
  const { data: activities, refetch: refetchActivities } = useQuery({
    queryKey: ['testerActivities', testAccount?.id],
    queryFn: async () => {
      if (!testAccount?.id) return [];
      const acts = await base44.entities.TesterActivity.filter(
        { test_account_id: testAccount.id },
        '-timestamp',
        50
      );
      return acts;
    },
    enabled: !!testAccount?.id
  });

  const handleStartSession = async () => {
    try {
      const response = await base44.functions.invoke('startTestSession', {
        test_account_id: testAccount.id
      });

      if (response.data.success) {
        setSessionActive(true);
        setSessionStartTime(new Date());
        toast.success('Test-Session gestartet 🚀');
      }
    } catch (error) {
      toast.error('Fehler beim Starten der Session: ' + error.message);
    }
  };

  const handleEndSession = async () => {
    try {
      const duration = Math.round((new Date() - sessionStartTime) / 60000); // Minuten
      
      const response = await base44.functions.invoke('endTestSession', {
        test_account_id: testAccount.id,
        duration_minutes: duration
      });

      if (response.data.success) {
        setSessionActive(false);
        setSessionStartTime(null);
        toast.success('Session beendet ✅');
        refetchActivities();
      }
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    }
  };

  if (!testAccount) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-12 text-center">
          <p className="text-slate-600 font-light">Lade Tester-Daten...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header Card */}
      <Card className="p-6 mb-6 border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-light text-slate-800">Tester Dashboard</h1>
            <p className="text-sm font-light text-slate-500 mt-1">
              Willkommen, {testAccount.tester_name}
            </p>
          </div>
          {sessionActive ? (
            <Button 
              onClick={handleEndSession}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Session beenden
            </Button>
          ) : (
            <Button 
              onClick={handleStartSession}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <Play className="w-4 h-4" />
              Session starten
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-light text-slate-500">Sessions</p>
            <p className="text-2xl font-light text-slate-800">{testAccount.total_sessions || 0}</p>
          </div>
          <div>
            <p className="text-xs font-light text-slate-500">Seiten besucht</p>
            <p className="text-2xl font-light text-slate-800">{testAccount.pages_visited || 0}</p>
          </div>
          <div>
            <p className="text-xs font-light text-slate-500">Probleme gemeldet</p>
            <p className="text-2xl font-light text-slate-800">{testAccount.problems_reported || 0}</p>
          </div>
        </div>
      </Card>

      {/* Session Timer */}
      {sessionActive && sessionStartTime && (
        <Card className="p-4 mb-6 bg-green-50 border border-green-200">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600 animate-pulse" />
            <p className="font-light text-green-700">
              Session läuft seit {Math.round((new Date() - sessionStartTime) / 60000)} Minuten
            </p>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Aktivitäten
          </TabsTrigger>
          <TabsTrigger value="communication" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            Nachricht
          </TabsTrigger>
        </TabsList>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-2">
          {!activities || activities.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-slate-500 font-light">Noch keine Aktivitäten</p>
            </Card>
          ) : (
            activities.map((activity, idx) => (
              <Card key={idx} className="p-4 border border-slate-100">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-light text-slate-700 capitalize">
                      {activity.activity_type.replace('_', ' ')}
                    </p>
                    {activity.page_title && (
                      <p className="text-xs font-light text-slate-500 mt-1">{activity.page_title}</p>
                    )}
                  </div>
                  <span className="text-xs font-light text-slate-400">
                    {new Date(activity.timestamp).toLocaleTimeString('de-DE')}
                  </span>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication">
          <Card className="p-6 border border-slate-100">
            <p className="text-sm font-light text-slate-600 mb-4">
              Nachricht an Entwickler schreiben
            </p>
            <textarea 
              placeholder="Schreib eine Nachricht..."
              className="w-full p-3 border border-slate-200 rounded-lg font-light text-sm mb-3"
              rows={4}
            />
            <Button className="bg-slate-700 hover:bg-slate-800">Senden</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}