import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    Edit
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import ProblemDetailDialog from '../components/support/ProblemDetailDialog';
import BugLinkingDialog from '../components/support/BugLinkingDialog';
import SolutionEditor from '../components/support/SolutionEditor';
import AutomationRules from '../components/support/AutomationRules';

export default function SupportCenter() {
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

    const queryClient = useQueryClient();

    const { data: problems = [], isLoading } = useQuery({
        queryKey: ['user-problems'],
        queryFn: () => base44.entities.UserProblem.list('-created_date', 500)
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Support-Center</h1>
                <p className="text-slate-600 mt-1">Verwaltung aller Support-Anfragen und Probleme</p>
            </div>

            {/* Statistik-Karten */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600">Offen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{openProblems.length}</div>
                        <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                            <TrendingUp className="w-4 h-4 text-orange-500" />
                            <span>+{todayProblems.length} heute</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600">Heute Neu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{todayProblems.length}</div>
                        <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                            <TrendingDown className="w-4 h-4" />
                            <span>Normal</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600">Ø Lösungszeit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{avgSolutionTime}h</div>
                        <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                            <Clock className="w-4 h-4" />
                            <span>Durchschnitt</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600">Zufriedenheit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold flex items-center gap-1">
                            {avgRating}
                            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                            {withRating.length} Bewertungen
                        </div>
                    </CardContent>
                </Card>
            </div>

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

            {/* Probleme-Liste */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Probleme ({filteredProblems.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-600">Lade Probleme...</div>
                    ) : filteredProblems.length === 0 ? (
                        <div className="text-center py-8 text-slate-600">Keine Probleme gefunden</div>
                    ) : (
                        <div className="space-y-2">
                            {filteredProblems.map(problem => (
                                <div
                                    key={problem.id}
                                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedProblem(problem)}
                                >
                                    <div className="flex-shrink-0">
                                        <Badge className={severityColors[problem.schweregrad]}>
                                            {problem.schweregrad}
                                        </Badge>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-slate-900 truncate">
                                            {problem.problem_titel}
                                        </div>
                                        <div className="text-sm text-slate-600 mt-1 flex items-center gap-3">
                                            <span>{problem.created_by || 'Anonym'}</span>
                                            <span>•</span>
                                            <span>{problem.kategorie}</span>
                                            {problem.betroffenes_modul && (
                                                <>
                                                    <span>•</span>
                                                    <span>{problem.betroffenes_modul}</span>
                                                </>
                                            )}
                                            <span>•</span>
                                            <span className="text-slate-500">{formatTimeAgo(problem.created_date)}</span>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <Badge className={statusColors[problem.status]}>
                                            {problem.status}
                                        </Badge>
                                    </div>
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
                    )}
                </CardContent>
            </Card>

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
        </div>
    );
}