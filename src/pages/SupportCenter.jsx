import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BulkActionsToolbar from '../components/support/BulkActionsToolbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    TrendingUp, 
    TrendingDown,
    MessageSquare,
    Filter,
    Star,
    Edit,
    Sparkles
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import ProblemDetailDialog from '../components/support/ProblemDetailDialog';
import BugLinkingDialog from '../components/support/BugLinkingDialog';
import SolutionEditor from '../components/support/SolutionEditor';
import AutomationRules from '../components/support/AutomationRules';
import TrendAnalysis from '../components/support/TrendAnalysis';
import RefreshSettings from '../components/support/RefreshSettings';
import Dashboard from '../components/support/analytics/Dashboard';
import IntelligentProblemDialog from '../components/testing/IntelligentProblemDialog';
import ModulAnalysis from '../components/support/analytics/ModulAnalysis';
import UserSegments from '../components/support/analytics/UserSegments';
import PerformanceMetrics from '../components/support/analytics/PerformanceMetrics';
import TimePatterns from '../components/support/analytics/TimePatterns';
import ImprovementPotentials from '../components/support/analytics/ImprovementPotentials';
import TeamPerformance from '../components/support/analytics/TeamPerformance';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SupportCenter() {
    const [selectedProblems, setSelectedProblems] = useState([]);
    const [filters, setFilters] = useState({
        status: 'Alle',
        kategorie: 'Alle',
        schweregrad: 'Alle',
        search: ''
    });
    const [selectedProblem, setSelectedProblem] = useState(null);
    const [showBugLinking, setShowBugLinking] = useState(false);
    const [showSolutionEditor, setShowSolutionEditor] = useState(false);
    const [linkingProblem, setLinkingProblem] = useState(null);
    const [activeTab, setActiveTab] = useState('tickets');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [showSettings, setShowSettings] = useState(false);
    const [showIntelligentDialog, setShowIntelligentDialog] = useState(false);
    const [refreshSettings, setRefreshSettings] = useState(() => {
        const saved = localStorage.getItem('support-refresh-settings');
        return saved ? JSON.parse(saved) : { autoRefresh: true, frequency: '30', soundEnabled: false };
    });
    const [lastCriticalCount, setLastCriticalCount] = useState(0);

    const queryClient = useQueryClient();

    const { data: problems = [], isLoading } = useQuery({
        queryKey: ['user-problems'],
        queryFn: () => base44.entities.UserProblem.list('-created_date', 500),
        refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh alle 30s
        refetchIntervalInBackground: false
    });

    const { data: solutions = [] } = useQuery({
        queryKey: ['problem-solutions'],
        queryFn: () => base44.entities.ProblemSolution.filter({ is_published: true })
    });

    const { data: statistics = [] } = useQuery({
        queryKey: ['problem-statistics'],
        queryFn: () => base44.entities.ProblemStatistics.list('-datum', 30)
    });

    // Statistiken berechnen
    const today = new Date().toISOString().split('T')[0];
    const todayProblems = problems.filter(p => 
        p.created_date && p.created_date.startsWith(today)
    );
    const openProblems = problems.filter(p => 
        p.status !== 'Gelöst' && p.status !== 'Wont-Fix'
    );
    const solvedProblems = problems.filter(p => p.status === 'Gelöst');
    const withSolutionTime = problems.filter(p => p.loesungszeit_stunden);
    const avgSolutionTime = withSolutionTime.length > 0
        ? (withSolutionTime.reduce((sum, p) => sum + p.loesungszeit_stunden, 0) / withSolutionTime.length).toFixed(1)
        : 0;
    const withRating = problems.filter(p => p.user_zufriedenheit);
    const avgRating = withRating.length > 0
        ? (withRating.reduce((sum, p) => sum + p.user_zufriedenheit, 0) / withRating.length).toFixed(1)
        : 0;

    // Filter anwenden
    const filteredProblems = problems.filter(p => {
        if (filters.status !== 'Alle' && p.status !== filters.status) return false;
        if (filters.kategorie !== 'Alle' && p.kategorie !== filters.kategorie) return false;
        if (filters.schweregrad !== 'Alle' && p.schweregrad !== filters.schweregrad) return false;
        if (filters.search && !p.problem_titel.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
    });

    // Nach Schweregrad gruppieren mit Auto-Update-Frequenzen
    const kritisch = filteredProblems.filter(p => p.schweregrad === 'Kritisch' && p.status !== 'Gelöst');
    const hoch = filteredProblems.filter(p => p.schweregrad === 'Hoch' && p.status !== 'Gelöst');
    const normal = filteredProblems.filter(p => ['Mittel', 'Niedrig', 'Kosmetisch'].includes(p.schweregrad) && p.status !== 'Gelöst');

    // Chart-Daten für Statistiken
    const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
        const dayProblems = problems.filter(p => p.created_date && p.created_date.startsWith(date));
        return {
            datum: format(new Date(date), 'dd.MM', { locale: de }),
            probleme: dayProblems.length,
            gelöst: dayProblems.filter(p => p.status === 'Gelöst').length
        };
    });

    // Kategorie-Verteilung für Pie Chart
    const kategorieData = problems.reduce((acc, p) => {
        acc[p.kategorie] = (acc[p.kategorie] || 0) + 1;
        return acc;
    }, {});
    const pieData = Object.entries(kategorieData).map(([name, value]) => ({ name, value }));
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    // Top Probleme
    const thisWeek = subDays(new Date(), 7);
    const weekProblems = problems.filter(p => new Date(p.created_date) > thisWeek);
    const problemCounts = weekProblems.reduce((acc, p) => {
        const key = p.problem_titel.substring(0, 50);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    const top10Problems = Object.entries(problemCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([titel, anzahl]) => ({ titel, anzahl }));

    const severityColors = {
        'Kritisch': 'bg-red-100 text-red-800',
        'Hoch': 'bg-orange-100 text-orange-800',
        'Mittel': 'bg-yellow-100 text-yellow-800',
        'Niedrig': 'bg-blue-100 text-blue-800',
        'Kosmetisch': 'bg-slate-100 text-slate-800'
    };

    const statusColors = {
        'Neu': 'bg-purple-100 text-purple-800',
        'In Bearbeitung': 'bg-blue-100 text-blue-800',
        'Gelöst': 'bg-green-100 text-green-800',
        'Kann nicht reproduzieren': 'bg-slate-100 text-slate-800',
        'Wont-Fix': 'bg-slate-100 text-slate-800',
        'Duplikat': 'bg-slate-100 text-slate-800'
    };

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        return `${diffDays}d`;
    };

    // Settings Listener
    React.useEffect(() => {
        const handleSettingsChange = (e) => {
            setRefreshSettings(e.detail);
            setAutoRefresh(e.detail.autoRefresh);
        };
        window.addEventListener('refresh-settings-changed', handleSettingsChange);
        return () => window.removeEventListener('refresh-settings-changed', handleSettingsChange);
    }, []);

    // Auto-Update Timer mit Einstellungen
    React.useEffect(() => {
        if (autoRefresh && refreshSettings.autoRefresh) {
            const frequency = parseInt(refreshSettings.frequency) * 1000;
            const interval = setInterval(() => {
                // Arbeitszeiten prüfen
                if (refreshSettings.workHoursOnly) {
                    const now = new Date();
                    const currentTime = now.getHours() * 60 + now.getMinutes();
                    const [startH, startM] = refreshSettings.startHour.split(':').map(Number);
                    const [endH, endM] = refreshSettings.endHour.split(':').map(Number);
                    const startTime = startH * 60 + startM;
                    const endTime = endH * 60 + endM;
                    
                    if (currentTime < startTime || currentTime > endTime) {
                        return; // Außerhalb der Arbeitszeiten
                    }
                }
                setLastUpdate(new Date());
            }, frequency);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, refreshSettings]);

    // Kritische Tickets Benachrichtigung
    React.useEffect(() => {
        const newCriticalCount = kritisch.length;
        if (newCriticalCount > lastCriticalCount && lastCriticalCount > 0) {
            // Sound
            if (refreshSettings.soundEnabled) {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTUIGWi77OXQTwgNVKzn77BdGAg5jufw0IMwBSJ+zfLeizsKFGS36+ypWhYKSKXh775tJAQng8rx2Ik2Bxtrt+vm0VMIDVSp5+6wXhoIOo7j8NCDLwYge8vy3og7CRZmu+rq');
                audio.volume = 0.3;
                audio.play().catch(() => {});
            }
            
            // Desktop-Benachrichtigung
            if (refreshSettings.desktopNotifications && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('🔴 Neues kritisches Ticket!', {
                    body: `${newCriticalCount - lastCriticalCount} neue kritische Tickets im Support-Center`,
                    icon: '/icon.png',
                    badge: '/icon.png'
                });
            }
        }
        setLastCriticalCount(newCriticalCount);
    }, [kritisch.length, refreshSettings, lastCriticalCount]);

    // Pause bei inaktivem Tab
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                setLastUpdate(new Date());
                queryClient.invalidateQueries({ queryKey: ['user-problems'] });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [queryClient]);

    const timeSinceUpdate = Math.floor((new Date() - lastUpdate) / 1000);

    return (
        <div className="space-y-6">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">🆘 Support-Center</h1>
                    <p className="text-slate-600 mt-1">Live-Überwachung aller Support-Anfragen</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">
                        Letzte Aktualisierung: vor {timeSinceUpdate}s
                    </span>
                    <Button
                        onClick={() => setShowIntelligentDialog(true)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Intelligent melden
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSettings(true)}
                    >
                        <SettingsIcon className="w-4 h-4 mr-2" />
                        Einstellungen
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        {autoRefresh ? '⏸️ Pausieren' : '▶️ Fortsetzen'}
                    </Button>
                </div>
            </motion.div>

            {/* Live-Übersicht */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
            <Card className="border-2 border-emerald-300 bg-emerald-50">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        📊 LIVE-ÜBERSICHT
                        {autoRefresh && <span className="animate-pulse text-xs text-emerald-600">● Live</span>}
                    </CardTitle>
                </CardHeader>
            </Card>
            </motion.div>

            {/* Statistik-Karten */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: "Offen", value: openProblems.length, extra: `+${todayProblems.length} heute` },
                    { title: "Heute Neu", value: todayProblems.length, extra: "Normal" },
                    { title: "Ø Lösungszeit", value: `${avgSolutionTime}h`, extra: "Durchschnitt" },
                    { title: "Zufriedenheit", value: avgRating, extra: `${withRating.length} Bewertungen`, star: true }
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + idx * 0.05 }}
                    >
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold flex items-center gap-1">
                            {stat.value}
                            {stat.star && <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />}
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                            {stat.extra}
                        </div>
                    </CardContent>
                </Card>
                    </motion.div>
                ))}
            </div>

            {/* Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="dashboard">
                        📊 Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="tickets">
                        🎫 Tickets {openProblems.length > 0 && <Badge className="ml-2 bg-red-600">{openProblems.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="analysen">
                        📈 Analysen
                    </TabsTrigger>
                    <TabsTrigger value="wissensdatenbank">📚 Wissen</TabsTrigger>
                    <TabsTrigger value="trends">🔥 Trends</TabsTrigger>
                    <TabsTrigger value="automation">⚡ Auto</TabsTrigger>
                </TabsList>

                {/* TAB: DASHBOARD */}
                <TabsContent value="dashboard">
                    <Dashboard 
                        problems={problems} 
                        solutions={solutions}
                        onNavigate={setActiveTab}
                    />
                </TabsContent>

                {/* TAB: TICKETS */}
                <TabsContent value="tickets" className="space-y-4">
                    {/* Bulk Actions Toolbar */}
                    <BulkActionsToolbar 
                        selectedIds={selectedProblems}
                        onActionComplete={() => {
                            setSelectedProblems([]);
                            queryClient.invalidateQueries({ queryKey: ['user-problems'] });
                        }}
                    />

                    {/* Filter */}
                    <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-[200px]">
                            <Input
                                placeholder="Suche nach Problem..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                        <Select
                            value={filters.status}
                            onValueChange={(value) => setFilters({ ...filters, status: value })}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Alle">Alle Status</SelectItem>
                                <SelectItem value="Neu">Neu</SelectItem>
                                <SelectItem value="In Bearbeitung">In Bearbeitung</SelectItem>
                                <SelectItem value="Gelöst">Gelöst</SelectItem>
                                <SelectItem value="Kann nicht reproduzieren">Nicht reproduzierbar</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.kategorie}
                            onValueChange={(value) => setFilters({ ...filters, kategorie: value })}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Alle">Alle Kategorien</SelectItem>
                                <SelectItem value="Bedienung">Bedienung</SelectItem>
                                <SelectItem value="Bug">Bug</SelectItem>
                                <SelectItem value="Datenimport">Datenimport</SelectItem>
                                <SelectItem value="Performance">Performance</SelectItem>
                                <SelectItem value="Feature-Request">Feature-Request</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.schweregrad}
                            onValueChange={(value) => setFilters({ ...filters, schweregrad: value })}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Alle">Alle Schweregrade</SelectItem>
                                <SelectItem value="Kritisch">Kritisch</SelectItem>
                                <SelectItem value="Hoch">Hoch</SelectItem>
                                <SelectItem value="Mittel">Mittel</SelectItem>
                                <SelectItem value="Niedrig">Niedrig</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

                    {/* Kritische Tickets - Update alle 10 Sek */}
                    {kritisch.length > 0 && (
                        <Card className="border-2 border-red-300 bg-red-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-900">
                                    <AlertCircle className="w-5 h-5" />
                                    🔴 KRITISCH ({kritisch.length}) - Auto-Update: 10 Sek
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {kritisch.map(problem => (
                                        <div
                                                    key={problem.id}
                                                    className="flex items-center gap-4 p-3 bg-white rounded-lg border border-red-200 hover:shadow-md cursor-pointer transition-all"
                                                    onClick={(e) => {
                                                        if (e.target.type !== 'checkbox') {
                                                            setSelectedProblem(problem);
                                                        }
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProblems.includes(problem.id)}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedProblems(prev => 
                                                                prev.includes(problem.id) 
                                                                    ? prev.filter(id => id !== problem.id)
                                                                    : [...prev, problem.id]
                                                            );
                                                        }}
                                                        className="w-4 h-4"
                                                    />
                                                    <Badge className="bg-red-600 text-white">#{problem.id.substring(0, 6)}</Badge>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-900 truncate">{problem.problem_titel}</p>
                                                <p className="text-sm text-slate-600">{problem.created_by || 'Anonym'}</p>
                                            </div>
                                            <Badge variant="outline" className="text-red-700">{formatTimeAgo(problem.created_date)}</Badge>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setLinkingProblem(problem);
                                                    setShowBugLinking(true);
                                                }}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Hohe Tickets - Update alle 30 Sek */}
                    {hoch.length > 0 && (
                        <Card className="border-2 border-orange-300 bg-orange-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-orange-900">
                                    <AlertCircle className="w-5 h-5" />
                                    🟡 HOCH ({hoch.length}) - Auto-Update: 30 Sek
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {hoch.map(problem => (
                                        <div
                                            key={problem.id}
                                            className="flex items-center gap-4 p-3 bg-white rounded-lg border border-orange-200 hover:shadow-md cursor-pointer transition-all"
                                            onClick={() => setSelectedProblem(problem)}
                                        >
                                            <Badge className="bg-orange-600 text-white">#{problem.id.substring(0, 6)}</Badge>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-900 truncate">{problem.problem_titel}</p>
                                                <p className="text-sm text-slate-600">{problem.kategorie}</p>
                                            </div>
                                            <Badge variant="outline">{formatTimeAgo(problem.created_date)}</Badge>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setLinkingProblem(problem);
                                                    setShowBugLinking(true);
                                                }}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Normale Tickets - Update alle 60 Sek */}
                    {normal.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                    🟢 NORMAL ({normal.length}) - Auto-Update: 60 Sek
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {normal.map(problem => (
                                        <div
                                            key={problem.id}
                                            className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-all"
                                            onClick={() => setSelectedProblem(problem)}
                                        >
                                            <Badge variant="outline">#{problem.id.substring(0, 6)}</Badge>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 truncate">{problem.problem_titel}</p>
                                            </div>
                                            <Badge className={severityColors[problem.schweregrad]}>{problem.schweregrad}</Badge>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setLinkingProblem(problem);
                                                    setShowBugLinking(true);
                                                }}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* TAB: ANALYSEN */}
                <TabsContent value="analysen">
                    <Tabs defaultValue="modul">
                        <TabsList className="grid w-full grid-cols-6 mb-4">
                            <TabsTrigger value="modul">🎯 Module</TabsTrigger>
                            <TabsTrigger value="user">👥 User</TabsTrigger>
                            <TabsTrigger value="performance">⏱️ Performance</TabsTrigger>
                            <TabsTrigger value="zeit">📅 Zeit</TabsTrigger>
                            <TabsTrigger value="verbesserung">💡 Verbesserung</TabsTrigger>
                            <TabsTrigger value="team">👨‍💻 Team</TabsTrigger>
                        </TabsList>

                        <TabsContent value="modul">
                            <ModulAnalysis problems={problems} />
                        </TabsContent>

                        <TabsContent value="user">
                            <UserSegments problems={problems} />
                        </TabsContent>

                        <TabsContent value="performance">
                            <PerformanceMetrics problems={problems} />
                        </TabsContent>

                        <TabsContent value="zeit">
                            <TimePatterns problems={problems} />
                        </TabsContent>

                        <TabsContent value="verbesserung">
                            <ImprovementPotentials problems={problems} />
                        </TabsContent>

                        <TabsContent value="team">
                            <TeamPerformance problems={problems} />
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                {/* TAB: WISSENSDATENBANK */}
                <TabsContent value="wissensdatenbank">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                📚 Wissensdatenbank
                                <Badge variant="outline">Statisch - Kein Auto-Update</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {solutions.length === 0 ? (
                                <div className="text-center py-12 text-slate-600">
                                    Noch keine Lösungen in der Wissensdatenbank
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {solutions.slice(0, 10).map(solution => (
                                        <div key={solution.id} className="p-4 border rounded-lg hover:bg-slate-50">
                                            <h3 className="font-semibold text-slate-900">{solution.titel}</h3>
                                            <p className="text-sm text-slate-600 mt-1">{solution.beschreibung}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="outline">{solution.anzahl_aufrufe || 0} Aufrufe</Badge>
                                                {solution.hilfreich_prozent && (
                                                    <Badge variant="outline">{solution.hilfreich_prozent}% hilfreich</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: TRENDS */}
                <TabsContent value="trends">
                    <TrendAnalysis problems={problems} />
                </TabsContent>

                {/* TAB: AUTOMATION */}
                <TabsContent value="automation">
                    <AutomationRules />
                </TabsContent>
            </Tabs>
            </motion.div>

            {/* Dialoge */}
            {selectedProblem && (
                <ProblemDetailDialog
                    problem={selectedProblem}
                    open={!!selectedProblem}
                    onOpenChange={(open) => !open && setSelectedProblem(null)}
                />
            )}

            <BugLinkingDialog
                open={showBugLinking}
                onOpenChange={setShowBugLinking}
                problem={linkingProblem}
            />

            <SolutionEditor
                open={showSolutionEditor}
                onOpenChange={setShowSolutionEditor}
                problemId={selectedProblem?.id}
            />

            <RefreshSettings
                open={showSettings}
                onOpenChange={setShowSettings}
            />

            <IntelligentProblemDialog
                open={showIntelligentDialog}
                onOpenChange={setShowIntelligentDialog}
            />
        </div>
    );
}