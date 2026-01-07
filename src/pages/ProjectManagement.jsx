import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
    Rocket,
    Code,
    Bug,
    Clock,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Calendar,
    Users,
    BarChart3,
    RefreshCw,
    Plus,
    Filter,
    Target,
    Zap,
    Package
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import FeatureDialog from '../components/project/FeatureDialog';

export default function ProjectManagement() {
    const [activeTab, setActiveTab] = useState('roadmap');
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [showFeatureDialog, setShowFeatureDialog] = useState(false);
    const [editingFeature, setEditingFeature] = useState(null);
    const queryClient = useQueryClient();

    // Auto-Refresh alle 5 Minuten
    const { data: features = [], refetch: refetchFeatures } = useQuery({
        queryKey: ['project-features'],
        queryFn: () => base44.entities.ProjectFeature.list('-created_date', 500),
        refetchInterval: 300000 // 5 Minuten
    });

    const { data: bugs = [] } = useQuery({
        queryKey: ['user-problems-bugs'],
        queryFn: () => base44.entities.UserProblem.filter({ ist_bug: true }, '-created_date', 200),
        refetchInterval: 300000
    });

    // Auto-Refresh Interval
    useEffect(() => {
        const interval = setInterval(() => {
            refetchFeatures();
            setLastUpdate(new Date());
        }, 300000); // 5 Minuten

        return () => clearInterval(interval);
    }, [refetchFeatures]);

    // Statistiken berechnen
    const inEntwicklung = features.filter(f => f.status === 'In Entwicklung');
    const geplant = features.filter(f => f.status === 'Geplant');
    const fertig = features.filter(f => f.status === 'Fertig');
    const testing = features.filter(f => f.status === 'Testing');

    const offeneBugs = bugs.filter(b => b.status !== 'Gelöst' && b.status !== 'Wont-Fix');
    const kritischeBugs = offeneBugs.filter(b => b.schweregrad === 'Kritisch');

    // Durchschnittlicher Fortschritt
    const avgProgress = inEntwicklung.length > 0
        ? Math.round(inEntwicklung.reduce((sum, f) => sum + (f.fortschritt_prozent || 0), 0) / inEntwicklung.length)
        : 0;

    // Sprint-Statistiken
    const currentSprint = features.filter(f => f.sprint && f.status !== 'Fertig');
    const sprintProgress = currentSprint.length > 0
        ? Math.round(currentSprint.reduce((sum, f) => sum + (f.fortschritt_prozent || 0), 0) / currentSprint.length)
        : 0;

    // Nächste 3 Monate
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    const upcomingFeatures = geplant.filter(f => {
        if (!f.eta_datum) return true;
        return parseISO(f.eta_datum) <= threeMonthsLater;
    });

    const statusColors = {
        'Geplant': 'bg-slate-100 text-slate-800',
        'In Entwicklung': 'bg-blue-100 text-blue-800',
        'Testing': 'bg-purple-100 text-purple-800',
        'Fertig': 'bg-green-100 text-green-800',
        'Pausiert': 'bg-yellow-100 text-yellow-800',
        'Abgebrochen': 'bg-red-100 text-red-800'
    };

    const priorityColors = {
        'Kritisch': 'bg-red-100 text-red-800 border-red-300',
        'Hoch': 'bg-orange-100 text-orange-800 border-orange-300',
        'Mittel': 'bg-yellow-100 text-yellow-800 border-yellow-300',
        'Niedrig': 'bg-blue-100 text-blue-800 border-blue-300'
    };

    const getDaysUntil = (date) => {
        if (!date) return null;
        const days = differenceInDays(parseISO(date), new Date());
        return days;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">🚀 Projekt-Management</h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Auto-Refresh: 5 Minuten • Letztes Update: {format(lastUpdate, 'HH:mm:ss', { locale: de })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            refetchFeatures();
                            setLastUpdate(new Date());
                        }}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Aktualisieren
                    </Button>
                    <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                            setEditingFeature(null);
                            setShowFeatureDialog(true);
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Neues Feature
                    </Button>
                </div>
            </div>

            {/* Live-Statistik Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Code className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{inEntwicklung.length}</p>
                                <p className="text-xs text-slate-600">In Entwicklung</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-slate-600" />
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{geplant.length}</p>
                                <p className="text-xs text-slate-600">Geplant</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{fertig.length}</p>
                                <p className="text-xs text-slate-600">Fertig</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Bug className="w-8 h-8 text-red-600" />
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{offeneBugs.length}</p>
                                <p className="text-xs text-slate-600">Offene Bugs</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-purple-600" />
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{avgProgress}%</p>
                                <p className="text-xs text-slate-600">Ø Fortschritt</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="roadmap">
                        Roadmap {inEntwicklung.length > 0 && <Badge className="ml-2 bg-blue-600">{inEntwicklung.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="bugs">
                        Bugs {kritischeBugs.length > 0 && <Badge className="ml-2 bg-red-600">{kritischeBugs.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="sprint">Sprint</TabsTrigger>
                </TabsList>

                {/* TAB: ROADMAP */}
                <TabsContent value="roadmap" className="space-y-4">
                    {/* In Entwicklung */}
                    {inEntwicklung.length > 0 && (
                        <Card className="border-2 border-blue-300 bg-blue-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-900">
                                    <Code className="w-5 h-5" />
                                    🏗️ IN ENTWICKLUNG ({inEntwicklung.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {inEntwicklung.map(feature => {
                                        const daysUntil = getDaysUntil(feature.eta_datum);
                                        const isDelayed = daysUntil !== null && daysUntil < 0;

                                        return (
                                            <Card 
                                                key={feature.id} 
                                                className="bg-white cursor-pointer hover:shadow-md transition-shadow"
                                                onClick={() => {
                                                    setEditingFeature(feature);
                                                    setShowFeatureDialog(true);
                                                }}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="space-y-3">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h3 className="font-semibold text-slate-900">{feature.titel}</h3>
                                                                <p className="text-sm text-slate-600 mt-1">{feature.beschreibung}</p>
                                                            </div>
                                                            <Badge className={priorityColors[feature.prioritaet]}>
                                                                {feature.prioritaet}
                                                            </Badge>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-600">Fortschritt</span>
                                                                <span className="font-semibold">{feature.fortschritt_prozent || 0}%</span>
                                                            </div>
                                                            <Progress value={feature.fortschritt_prozent || 0} className="h-2" />
                                                        </div>

                                                        <div className="flex items-center gap-4 text-sm">
                                                            {feature.eta_datum && (
                                                                <div className={cn(
                                                                    "flex items-center gap-1",
                                                                    isDelayed ? "text-red-600" : "text-slate-600"
                                                                )}>
                                                                    <Calendar className="w-4 h-4" />
                                                                    <span>ETA: {format(parseISO(feature.eta_datum), 'dd.MM.yyyy', { locale: de })}</span>
                                                                    {daysUntil !== null && (
                                                                        <Badge variant="outline" className={isDelayed ? "border-red-300 text-red-700" : "border-slate-300"}>
                                                                            {isDelayed ? `${Math.abs(daysUntil)}d verspätet` : `in ${daysUntil}d`}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {feature.entwickler_email && (
                                                                <div className="flex items-center gap-1 text-slate-600">
                                                                    <Users className="w-4 h-4" />
                                                                    <span>{feature.entwickler_email.split('@')[0]}</span>
                                                                </div>
                                                            )}
                                                            {feature.kategorie && (
                                                                <Badge variant="outline">{feature.kategorie}</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Geplant (nächste 3 Monate) */}
                    {upcomingFeatures.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    📋 GEPLANT (nächste 3 Monate)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {upcomingFeatures.map(feature => (
                                        <div
                                            key={feature.id}
                                            className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                        >
                                            <Badge className={priorityColors[feature.prioritaet]}>
                                                {feature.prioritaet}
                                            </Badge>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">{feature.titel}</p>
                                                <p className="text-sm text-slate-600">{feature.typ}</p>
                                            </div>
                                            {feature.eta_datum && (
                                                <Badge variant="outline">
                                                    {format(parseISO(feature.eta_datum), 'MMM yyyy', { locale: de })}
                                                </Badge>
                                            )}
                                            {feature.story_points && (
                                                <Badge variant="outline">{feature.story_points} SP</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Testing */}
                    {testing.length > 0 && (
                        <Card className="border-2 border-purple-300 bg-purple-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-purple-900">
                                    <Zap className="w-5 h-5" />
                                    🧪 IM TEST ({testing.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {testing.map(feature => (
                                        <div
                                            key={feature.id}
                                            className="flex items-center gap-4 p-3 bg-white rounded-lg"
                                        >
                                            <CheckCircle2 className="w-5 h-5 text-purple-600" />
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">{feature.titel}</p>
                                                <p className="text-sm text-slate-600">Fertig zur Freigabe</p>
                                            </div>
                                            <Badge className="bg-purple-600 text-white">Testing</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* TAB: FEATURES */}
                <TabsContent value="features" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Alle Features
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {features.map(feature => (
                                    <div
                                        key={feature.id}
                                        className="flex items-center gap-4 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <Badge className={statusColors[feature.status]}>
                                            {feature.status}
                                        </Badge>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 truncate">{feature.titel}</p>
                                            <p className="text-sm text-slate-600">{feature.typ} • {feature.kategorie || 'Keine Kategorie'}</p>
                                        </div>
                                        <Badge className={priorityColors[feature.prioritaet]}>
                                            {feature.prioritaet}
                                        </Badge>
                                        {feature.fortschritt_prozent > 0 && (
                                            <Badge variant="outline">{feature.fortschritt_prozent}%</Badge>
                                        )}
                                    </div>
                                ))}
                                {features.length === 0 && (
                                    <div className="text-center py-8 text-slate-600">
                                        Noch keine Features angelegt
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: BUGS */}
                <TabsContent value="bugs" className="space-y-4">
                    {kritischeBugs.length > 0 && (
                        <Card className="border-2 border-red-300 bg-red-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-900">
                                    <AlertCircle className="w-5 h-5" />
                                    🔴 KRITISCHE BUGS ({kritischeBugs.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {kritischeBugs.map(bug => (
                                        <div
                                            key={bug.id}
                                            className="flex items-center gap-4 p-3 bg-white rounded-lg border border-red-200"
                                        >
                                            <Bug className="w-5 h-5 text-red-600" />
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-900">{bug.problem_titel}</p>
                                                <p className="text-sm text-slate-600">
                                                    {bug.kategorie} • {bug.betroffenes_modul || 'Kein Modul'}
                                                </p>
                                            </div>
                                            <Badge className="bg-red-600 text-white">{bug.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bug className="w-5 h-5" />
                                Alle Bugs aus Support
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {offeneBugs.map(bug => (
                                    <div
                                        key={bug.id}
                                        className="flex items-center gap-4 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <Badge className={priorityColors[bug.schweregrad]}>
                                            {bug.schweregrad}
                                        </Badge>
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{bug.problem_titel}</p>
                                            <p className="text-sm text-slate-600">{bug.kategorie}</p>
                                        </div>
                                        <Badge variant="outline">{bug.status}</Badge>
                                    </div>
                                ))}
                                {offeneBugs.length === 0 && (
                                    <div className="text-center py-8 text-green-600">
                                        ✅ Keine offenen Bugs!
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: SPRINT */}
                <TabsContent value="sprint" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="w-5 h-5" />
                                Aktueller Sprint
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-lg font-semibold text-slate-900">Sprint Progress</p>
                                        <p className="text-sm text-slate-600">{currentSprint.length} Features im Sprint</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-blue-600">{sprintProgress}%</p>
                                        <p className="text-sm text-slate-600">Fertiggestellt</p>
                                    </div>
                                </div>
                                <Progress value={sprintProgress} className="h-3" />

                                <div className="space-y-2 mt-6">
                                    {currentSprint.map(feature => (
                                        <div
                                            key={feature.id}
                                            className="flex items-center gap-4 p-3 border rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">{feature.titel}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Progress value={feature.fortschritt_prozent || 0} className="h-1 flex-1" />
                                                    <span className="text-sm text-slate-600">{feature.fortschritt_prozent || 0}%</span>
                                                </div>
                                            </div>
                                            {feature.story_points && (
                                                <Badge variant="outline">{feature.story_points} SP</Badge>
                                            )}
                                        </div>
                                    ))}
                                    {currentSprint.length === 0 && (
                                        <div className="text-center py-8 text-slate-600">
                                            Kein Sprint geplant
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Feature Dialog */}
            <FeatureDialog
                open={showFeatureDialog}
                onOpenChange={setShowFeatureDialog}
                feature={editingFeature}
            />
        </div>
    );
}