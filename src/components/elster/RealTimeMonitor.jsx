import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function RealTimeMonitor() {
  const [liveStats, setLiveStats] = useState([]);

  const { data: submissions = [] } = useQuery({
    queryKey: ['elster-monitor'],
    queryFn: () => base44.entities.ElsterSubmission.list('-created_date', 100),
    refetchInterval: 10000 // Alle 10 Sekunden aktualisieren
  });

  useEffect(() => {
    // Simulate real-time data
    const now = new Date();
    const newDataPoint = {
      time: now.toLocaleTimeString('de-DE'),
      submitted: submissions.filter(s => s.status === 'SUBMITTED').length,
      accepted: submissions.filter(s => s.status === 'ACCEPTED').length,
      errors: submissions.filter(s => s.validation_errors?.length > 0).length
    };

    setLiveStats(prev => [...prev.slice(-20), newDataPoint]);
  }, [submissions]);

  const currentErrors = submissions.filter(s => s.validation_errors?.length > 0).length;
  const currentSubmitted = submissions.filter(s => s.status === 'SUBMITTED').length;
  const processingRate = submissions.filter(s => ['AI_PROCESSED', 'VALIDATED'].includes(s.status)).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-600">Fehler erkannt</div>
                <div className="text-2xl font-bold text-red-600">{currentErrors}</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-600">In Verarbeitung</div>
                <div className="text-2xl font-bold text-blue-600">{processingRate}</div>
              </div>
              <Clock className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-600">Akzeptiert</div>
                <div className="text-2xl font-bold text-green-600">
                  {submissions.filter(s => s.status === 'ACCEPTED').length}
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Live-Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {liveStats.length > 0 && (
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={liveStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="submitted" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}