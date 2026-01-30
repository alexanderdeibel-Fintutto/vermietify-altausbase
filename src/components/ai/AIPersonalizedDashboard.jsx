import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Zap, DollarSign, Clock } from 'lucide-react';

export default function AIPersonalizedDashboard() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        loadUserStats();
    }, []);

    async function loadUserStats() {
        const u = await base44.auth.me();
        setUser(u);

        if (!u) return;

        // Letzte 7 Tage
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const logs = await base44.entities.AIUsageLog.filter({
            user_email: u.email,
            created_date: { $gte: startDate.toISOString() }
        });

        const totalCost = logs.reduce((sum, l) => sum + l.cost_eur, 0);
        const totalRequests = logs.length;
        const avgResponseTime = logs.length > 0 
            ? logs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / logs.length 
            : 0;
        
        // Feature-Nutzung
        const featureUsage = {};
        logs.forEach(log => {
            featureUsage[log.feature] = (featureUsage[log.feature] || 0) + 1;
        });

        setStats({
            totalCost,
            totalRequests,
            avgResponseTime: Math.round(avgResponseTime),
            topFeature: Object.entries(featureUsage).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A',
            featureUsage
        });
    }

    if (!user || !stats) return null;

    return (
        <div className="grid grid-cols-4 gap-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                        <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold">{stats.totalRequests}</div>
                    <div className="text-sm text-slate-600">Meine Requests (7d)</div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold">{stats.totalCost.toFixed(2)} €</div>
                    <div className="text-sm text-slate-600">Meine Kosten (7d)</div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                        <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
                    <div className="text-sm text-slate-600">Ø Response-Zeit</div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="text-lg font-bold">{stats.topFeature}</div>
                    <div className="text-sm text-slate-600">Meist genutztes Feature</div>
                </CardContent>
            </Card>
        </div>
    );
}