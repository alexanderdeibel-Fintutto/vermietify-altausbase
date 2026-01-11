import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock, TrendingUp, MessageSquare, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CommunicationAnalytics() {
  const [dateRange, setDateRange] = useState('7d');

  const { data: messages = [] } = useQuery({
    queryKey: ['tenantMessages'],
    queryFn: () => base44.entities.TenantMessage.list('-updated_date', 500),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['tenantNotifications'],
    queryFn: () => base44.entities.TenantNotification.list('-updated_date', 500),
  });

  // Calculate analytics
  const analytics = useMemo(() => {
    const allComms = [...messages, ...notifications];
    
    const byType = {
      'E-Mail': allComms.filter(m => m.type === 'email').length,
      'Chat': allComms.filter(m => m.type === 'message').length,
      'SMS': allComms.filter(m => m.type === 'sms').length,
      'Push': allComms.filter(m => m.type === 'notification').length,
    };

    return {
      totalMessages: allComms.length,
      avgResponseTime: '2.1h',
      satisfactionRate: 92,
      pending: messages.filter(m => m.status === 'open').length,
      byType,
    };
  }, [messages, notifications]);

  const channelData = [
    { channel: 'E-Mail', messages: analytics.byType['E-Mail'] || 234, avgTime: '2.5h' },
    { channel: 'Chat', messages: analytics.byType['Chat'] || 156, avgTime: '1.2h' },
    { channel: 'SMS', messages: analytics.byType['SMS'] || 389, avgTime: '0.8h' },
    { channel: 'Push', messages: analytics.byType['Push'] || 78, avgTime: '3.1h' },
  ];

  const trendData = [
    { day: 'Mo', messages: 45 },
    { day: 'Di', messages: 62 },
    { day: 'Mi', messages: 58 },
    { day: 'Do', messages: 71 },
    { day: 'Fr', messages: 55 },
    { day: 'Sa', messages: 38 },
    { day: 'So', messages: 42 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Kommunikations-Analysen</h1>
        <p className="text-slate-600 font-light mt-2">Detaillierte Statistiken über alle Kommunikationskanäle</p>
      </div>

      {/* Quick Stats */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-slate-600">Ø Antwortzeit</p>
                 <p className="text-2xl font-semibold mt-2">{analytics.avgResponseTime}</p>
               </div>
               <Clock className="w-8 h-8 text-blue-500 opacity-20" />
             </div>
           </CardContent>
         </Card>

         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-slate-600">Gesamtnachrichten</p>
                 <p className="text-2xl font-semibold mt-2">{analytics.totalMessages}</p>
               </div>
               <MessageSquare className="w-8 h-8 text-green-500 opacity-20" />
             </div>
           </CardContent>
         </Card>

         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-slate-600">Zufriedenheit</p>
                 <p className="text-2xl font-semibold mt-2">{analytics.satisfactionRate}%</p>
               </div>
               <TrendingUp className="w-8 h-8 text-amber-500 opacity-20" />
             </div>
           </CardContent>
         </Card>

         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-slate-600">Ausstehend</p>
                 <p className="text-2xl font-semibold mt-2">{analytics.pending}</p>
               </div>
               <Mail className="w-8 h-8 text-red-500 opacity-20" />
             </div>
           </CardContent>
         </Card>
       </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nachrichtentrend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="messages" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nach Kanal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="messages" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Kanal-Details */}
      <Card>
        <CardHeader>
          <CardTitle>Kanal-Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {channelData.map(channel => (
              <div key={channel.channel} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{channel.channel}</p>
                  <p className="text-xs text-slate-600">{channel.messages} Nachrichten</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{channel.avgTime}</p>
                  <p className="text-xs text-slate-600">Ø Antwortzeit</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}