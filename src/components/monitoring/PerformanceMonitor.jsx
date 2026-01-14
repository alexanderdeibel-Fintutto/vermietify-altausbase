import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    pageLoadTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    renderTime: 0
  });

  const [performanceLog, setPerformanceLog] = useState([]);

  useEffect(() => {
    // Measure page load
    if (window.performance) {
      const navTiming = performance.getEntriesByType('navigation')[0];
      if (navTiming) {
        setMetrics(prev => ({
          ...prev,
          pageLoadTime: Math.round(navTiming.loadEventEnd - navTiming.fetchStart)
        }));
      }
    }

    // Monitor memory (if available)
    if (performance.memory) {
      const checkMemory = () => {
        const used = performance.memory.usedJSHeapSize;
        const total = performance.memory.totalJSHeapSize;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round((used / total) * 100)
        }));
      };
      checkMemory();
      const interval = setInterval(checkMemory, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  // Monitor API calls
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource' && entry.name.includes('api')) {
          setMetrics(prev => ({
            ...prev,
            apiResponseTime: Math.round(entry.duration)
          }));
          
          setPerformanceLog(prev => [...prev.slice(-9), {
            timestamp: new Date().toLocaleTimeString(),
            url: entry.name.split('/').pop(),
            duration: Math.round(entry.duration)
          }]);
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
    return () => observer.disconnect();
  }, []);

  const getStatusColor = (value, thresholds) => {
    if (value < thresholds.good) return 'text-green-600 bg-green-50';
    if (value < thresholds.warning) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Ladezeit</p>
                <p className={`text-xl font-bold ${getStatusColor(metrics.pageLoadTime, { good: 1000, warning: 3000 })}`}>
                  {metrics.pageLoadTime}ms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">API Response</p>
                <p className={`text-xl font-bold ${getStatusColor(metrics.apiResponseTime, { good: 500, warning: 1500 })}`}>
                  {metrics.apiResponseTime}ms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Speicher</p>
                <p className={`text-xl font-bold ${getStatusColor(metrics.memoryUsage, { good: 50, warning: 80 })}`}>
                  {metrics.memoryUsage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Status</p>
                <p className="text-xl font-bold text-green-600">Gut</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent API Calls */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte API-Aufrufe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {performanceLog.slice(-10).reverse().map((log, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{log.timestamp}</span>
                  <span className="text-sm">{log.url}</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={log.duration < 500 ? 'border-green-500 text-green-700' : log.duration < 1500 ? 'border-yellow-500 text-yellow-700' : 'border-red-500 text-red-700'}
                >
                  {log.duration}ms
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}