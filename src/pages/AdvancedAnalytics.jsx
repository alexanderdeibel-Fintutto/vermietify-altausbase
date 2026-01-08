import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, Package } from 'lucide-react';
import UserActivityChart from '@/components/analytics/UserActivityChart';
import ModuleUsageChart from '@/components/analytics/ModuleUsageChart';
import ExportButton from '@/components/reports/ExportButton.jsx';

export default function AdvancedAnalytics() {
  const [timeRange, setTimeRange] = useState('7');

  const { data: activities = [] } = useQuery({
    queryKey: ['user-activities'],
    queryFn: () => base44.asServiceRole.entities.UserActivity.list('-created_date', 1000)
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const { data: moduleAccess = [] } = useQuery({
    queryKey: ['module-access'],
    queryFn: () => base44.asServiceRole.entities.ModuleAccess.list()
  });

  // Analytics calculations
  const analytics = {
    totalActivities: activities.length,
    activeUsers: [...new Set(activities.map(a => a.user_id))].length,
    avgActivitiesPerUser: activities.length / users.length || 0,
    topUsers: Object.entries(
      activities.reduce((acc, a) => {
        acc[a.user_id] = (acc[a.user_id] || 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, count]) => ({
        user: users.find(u => u.id === userId),
        count
      })),
    activityByType: activities.reduce((acc, a) => {
      acc[a.action_type] = (acc[a.action_type] || 0) + 1;
      return acc;
    }, {}),
    moduleStats: {
      total: moduleAccess.length,
      active: moduleAccess.filter(ma => ma.is_active).length,
      revenue: moduleAccess.reduce((sum, ma) => sum + (ma.price_paid || 0), 0)
    }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Advanced Analytics</h1>
          <p className="text-slate-600">Detaillierte Analyse & Trends</p>
        </div>
        <ExportButton 
          reportType="Analytics Report"
          reportData={analytics}
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: BarChart3, label: "Aktivitäten", value: analytics.totalActivities, color: "blue" },
          { icon: Users, label: "Aktive User", value: analytics.activeUsers, color: "green" },
          { icon: TrendingUp, label: "Ø pro User", value: analytics.avgActivitiesPerUser.toFixed(1), color: "purple" },
          { icon: Package, label: "Module Revenue", value: `€${analytics.moduleStats.revenue.toFixed(0)}`, color: "orange" }
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
                <p className={`text-2xl font-bold ${stat.color !== 'blue' ? `text-${stat.color}-600` : ''}`}>
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
            </div>
          </CardContent>
        </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4"
      >
        <span className="text-sm font-medium">Zeitraum:</span>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Letzte 7 Tage</SelectItem>
            <SelectItem value="14">Letzte 14 Tage</SelectItem>
            <SelectItem value="30">Letzte 30 Tage</SelectItem>
            <SelectItem value="90">Letzte 90 Tage</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
      <Tabs defaultValue="activity">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Aktivitäten</TabsTrigger>
          <TabsTrigger value="modules">Module</TabsTrigger>
          <TabsTrigger value="users">Top Users</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4 mt-6">
          <UserActivityChart timeRange={parseInt(timeRange)} />
          
          <Card>
            <CardHeader>
              <CardTitle>Aktivitäten nach Typ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analytics.activityByType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{type}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(count / analytics.totalActivities) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="mt-6">
          <ModuleUsageChart />
        </TabsContent>

        <TabsContent value="users" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 aktivste Benutzer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topUsers.map((item, index) => (
                  <div key={item.user?.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{item.user?.full_name || item.user?.email || 'Unknown'}</div>
                        <div className="text-sm text-slate-500">{item.user?.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{item.count}</div>
                      <div className="text-xs text-slate-500">Aktivitäten</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </motion.div>
    </div>
  );
}