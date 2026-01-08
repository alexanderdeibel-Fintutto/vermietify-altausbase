import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TestTube, Play, Clock, Star, Target, 
  BarChart3, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TesterInvitationManager from '@/components/testing/TesterInvitationManager';
import TestAccountManager from '@/components/testing/TestAccountManager';
import TestAssignmentManager from '@/components/testing/TestAssignmentManager';
import CommunicationHub from '@/components/testing/CommunicationHub';

export default function TestingDashboard() {
  const [filterPeriod, setFilterPeriod] = useState('week');

  const { data: testSessions = [] } = useQuery({
    queryKey: ['test-sessions'],
    queryFn: () => base44.asServiceRole.entities.TestSession.list('-session_start')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const testers = users.filter(u => u.is_tester);

  // Aktivier Sessions (session_end ist null)
  const activeSessions = testSessions.filter(s => !s.session_end);

  // Statistiken
  const testStats = {
    activeTesters: testers.length,
    sessionsToday: testSessions.filter(s => {
      const today = new Date().toISOString().split('T')[0];
      return s.session_start?.startsWith(today);
    }).length,
    totalHours: testSessions.reduce((sum, s) => sum + (s.total_duration || 0), 0) / 60,
    averageRating: testSessions.filter(s => s.feedback_rating).length > 0
      ? (testSessions.reduce((sum, s) => sum + (s.feedback_rating || 0), 0) / testSessions.filter(s => s.feedback_rating).length).toFixed(1)
      : 0,
    uniqueFeatures: new Set(testSessions.flatMap(s => s.features_tested || [])).size
  };

  // Chart-Daten: Testzeit pro Tag (letzte 30 Tage)
  const testTimeData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const daysSessions = testSessions.filter(s => s.session_start?.startsWith(dateStr));
    const hours = daysSessions.reduce((sum, s) => sum + (s.total_duration || 0), 0) / 60;
    
    testTimeData.push({
      date: format(date, 'dd.MM', { locale: de }),
      hours: parseFloat(hours.toFixed(1))
    });
  }

  // Chart-Daten: Getestete Features
  const featureCount = {};
  testSessions.forEach(session => {
    (session.features_tested || []).forEach(feature => {
      featureCount[feature] = (featureCount[feature] || 0) + 1;
    });
  });

  const featureTestData = Object.entries(featureCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([feature, count]) => ({
      feature: feature.length > 20 ? feature.substring(0, 20) + '...' : feature,
      tests: count
    }));

  // Gefilterte Sessions
  const getFilteredSessions = () => {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch(filterPeriod) {
      case 'today':
        cutoffDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
      default:
        return testSessions;
    }
    
    return testSessions.filter(s => new Date(s.session_start) >= cutoffDate);
  };

  const filteredSessions = getFilteredSessions();

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tester-Dashboard</h1>
          <p className="text-slate-600">Übersicht aller Test-Aktivitäten und Auswertungen</p>
        </div>
      </motion.div>

      {/* Statistik-Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { icon: TestTube, label: "Aktive Tester", value: testStats.activeTesters, color: "blue" },
          { icon: Play, label: "Sessions heute", value: testStats.sessionsToday, color: "green" },
          { icon: Clock, label: "Gesamte Testzeit", value: `${Math.round(testStats.totalHours)}h`, color: "purple" },
          { icon: Star, label: "Ø Bewertung", value: testStats.averageRating, color: "orange" },
          { icon: Target, label: "Features getestet", value: testStats.uniqueFeatures, color: "red" }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
          >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
            </div>
          </CardContent>
        </Card>
          </motion.div>
        ))}
      </div>

      {/* Management Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">📊 Übersicht</TabsTrigger>
            <TabsTrigger value="invitations">📧 Einladungen</TabsTrigger>
            <TabsTrigger value="accounts">🔑 Test-Accounts</TabsTrigger>
            <TabsTrigger value="assignments">📋 Aufträge</TabsTrigger>
            <TabsTrigger value="communication">💬 Kommunikation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map(idx => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + idx * 0.1 }}
          >
            {idx === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Testzeit pro Tag (letzte 30 Tage)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={testTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="hours" stroke="#059669" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
            ) : (
        <Card>
          <CardHeader>
            <CardTitle>Getestete Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureTestData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="feature" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tests" fill="#0891b2" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
            )}
          </motion.div>
        ))}
      </div>

      {/* Management Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sessions">📊 Sessions</TabsTrigger>
            <TabsTrigger value="invitations">📧 Einladungen</TabsTrigger>
            <TabsTrigger value="accounts">👤 Test-Accounts</TabsTrigger>
            <TabsTrigger value="assignments">📋 Aufträge</TabsTrigger>
            <TabsTrigger value="communication">💬 Kommunikation</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions">
            {/* Aktive Test-Sessions */}
            <AnimatePresence>
            {activeSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ delay: 0.6 }}
        >
        <Card>
          <CardHeader>
            <CardTitle>Aktive Test-Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeSessions.map(session => {
                const tester = users.find(u => u.id === session.user_id);
                const duration = Math.round((new Date() - new Date(session.session_start)) / 60000);
                
                return (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{tester?.full_name?.charAt(0) || "T"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{tester?.full_name || tester?.email}</div>
                        <div className="text-sm text-slate-500">
                          {format(new Date(session.session_start), 'HH:mm', { locale: de })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{duration}min</Badge>
                      <div className="text-sm text-slate-600">
                        {session.actions_performed?.length || 0} Aktionen
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm">Aktiv</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        </motion.div>
        )}
        </AnimatePresence>

        {/* Test-Sessions Historie */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Test-Sessions Historie</CardTitle>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Heute</SelectItem>
                <SelectItem value="week">Diese Woche</SelectItem>
                <SelectItem value="month">Dieser Monat</SelectItem>
                <SelectItem value="all">Alle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredSessions.filter(s => s.session_end).map(session => {
              const tester = users.find(u => u.id === session.user_id);
              
              return (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar>
                      <AvatarFallback>{tester?.full_name?.charAt(0) || "T"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{tester?.full_name || tester?.email}</div>
                      <div className="text-sm text-slate-500">
                        {format(new Date(session.session_start), 'dd.MM HH:mm', { locale: de })} - {format(new Date(session.session_end), 'HH:mm', { locale: de })}
                      </div>
                    </div>
                    <Badge variant="outline">{Math.round(session.total_duration)}min</Badge>
                    <div className="text-sm text-slate-600">
                      {session.pages_visited?.length || 0} Seiten
                    </div>
                    <div className="text-sm text-slate-600">
                      {session.actions_performed?.length || 0} Aktionen
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {session.features_tested?.slice(0, 2).map(feature => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature.length > 15 ? feature.substring(0, 15) + '...' : feature}
                        </Badge>
                      ))}
                      {session.features_tested?.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{session.features_tested.length - 2}
                        </Badge>
                      )}
                    </div>
                    {session.feedback_rating && (
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < session.feedback_rating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
        </Card>
        </motion.div>
        </TabsContent>

        <TabsContent value="invitations">
        <TesterInvitationManager />
        </TabsContent>

        <TabsContent value="accounts">
        <TestAccountManager />
        </TabsContent>

        <TabsContent value="assignments">
        <TestAssignmentManager />
        </TabsContent>

        <TabsContent value="communication">
        <CommunicationHub />
        </TabsContent>
        </Tabs>
        </motion.div>
        </div>
        );
        }