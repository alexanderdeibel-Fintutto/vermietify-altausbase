import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Search, 
    HelpCircle, 
    Video, 
    BookOpen, 
    Star,
    ThumbsUp,
    ThumbsDown,
    Eye,
    Clock,
    MessageSquare,
    Plus
} from 'lucide-react';
import { cn } from "@/lib/utils";
import ReportProblemDialog from '../components/support/ReportProblemDialog';
import SolutionEditor from '../components/support/SolutionEditor';

export default function HilfeCenter() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Alle');
    const [selectedSolution, setSelectedSolution] = useState(null);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [showSolutionEditor, setShowSolutionEditor] = useState(false);
    const [editingSolution, setEditingSolution] = useState(null);

    const { data: solutions = [], isLoading } = useQuery({
        queryKey: ['problem-solutions'],
        queryFn: () => base44.entities.ProblemSolution.filter({ is_published: true })
    });

    const { data: problems = [] } = useQuery({
        queryKey: ['user-problems-public'],
        queryFn: () => base44.entities.UserProblem.filter({ status: 'Gelöst' })
    });

    const { data: currentUser } = useQuery({
        queryKey: ['current-user'],
        queryFn: async () => {
            try {
                return await base44.auth.me();
            } catch {
                return null;
            }
        }
    });
    
    const isAdmin = currentUser?.role === 'admin';

    // Kategorien aus Lösungen extrahieren
    const categories = [...new Set(solutions.flatMap(s => s.gilt_fuer_kategorien || []))];

    // Häufigste Fragen (nach Aufrufzahl)
    const topSolutions = [...solutions]
        .sort((a, b) => (b.anzahl_aufrufe || 0) - (a.anzahl_aufrufe || 0))
        .slice(0, 5);

    // Filter anwenden
    const filteredSolutions = solutions.filter(s => {
        const matchesSearch = !searchQuery || 
            s.titel.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.beschreibung.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'Alle' || 
            s.gilt_fuer_kategorien?.includes(selectedCategory);
        return matchesSearch && matchesCategory;
    });

    const handleRating = async (solutionId, helpful) => {
        const solution = solutions.find(s => s.id === solutionId);
        if (!solution) return;

        try {
            const updates = helpful ? 
                { anzahl_hilfreich: (solution.anzahl_hilfreich || 0) + 1 } :
                { anzahl_nicht_hilfreich: (solution.anzahl_nicht_hilfreich || 0) + 1 };
            
            const total = (solution.anzahl_hilfreich || 0) + (solution.anzahl_nicht_hilfreich || 0) + 1;
            const helpful_count = helpful ? (solution.anzahl_hilfreich || 0) + 1 : (solution.anzahl_hilfreich || 0);
            updates.hilfreich_prozent = ((helpful_count / total) * 100).toFixed(0);
            
            await base44.entities.ProblemSolution.update(solutionId, updates);
        } catch (error) {
            console.error('Rating error:', error);
        }
    };

    const handleViewSolution = async (solution) => {
        setSelectedSolution(solution);
        // Aufrufzahl erhöhen
        try {
            await base44.entities.ProblemSolution.update(solution.id, {
                anzahl_aufrufe: (solution.anzahl_aufrufe || 0) + 1
            });
        } catch (error) {
            console.error('View count error:', error);
        }
    };

    if (selectedSolution) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-4xl mx-auto space-y-6"
            >
                <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex items-center gap-3"
                >
                    <Button variant="ghost" onClick={() => setSelectedSolution(null)}>
                        ← Zurück
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">{selectedSolution.titel}</CardTitle>
                        <div className="flex gap-4 text-sm text-slate-600 mt-2">
                            <span className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {selectedSolution.anzahl_aufrufe || 0} Aufrufe
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {selectedSolution.geschaetzte_dauer_minuten || 5} Min Lesezeit
                            </span>
                            {selectedSolution.zuletzt_aktualisiert && (
                                <>
                                    <span>•</span>
                                    <span>
                                        Aktualisiert: {new Date(selectedSolution.zuletzt_aktualisiert).toLocaleDateString('de-DE')}
                                    </span>
                                </>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="prose prose-slate max-w-none">
                            <p className="text-lg">{selectedSolution.beschreibung}</p>
                        </div>

                        {selectedSolution.schritte && selectedSolution.schritte.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Schritt-für-Schritt Anleitung</h3>
                                <div className="space-y-4">
                                    {selectedSolution.schritte.map((step, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                                                {step.nummer || (i + 1)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-slate-700">{step.text || step}</p>
                                                {step.screenshot_url && (
                                                    <img 
                                                        src={step.screenshot_url} 
                                                        alt={`Schritt ${i + 1}`}
                                                        className="mt-2 rounded-lg border"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedSolution.video_url && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Video-Tutorial</h3>
                                <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                                    <a 
                                        href={selectedSolution.video_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-blue-600 hover:underline"
                                    >
                                        <Video className="w-5 h-5" />
                                        Video ansehen
                                    </a>
                                </div>
                            </div>
                        )}

                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4">War dieser Artikel hilfreich?</h3>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => handleRating(selectedSolution.id, true)}
                                    className="flex-1"
                                >
                                    <ThumbsUp className="w-4 h-4 mr-2" />
                                    Ja ({selectedSolution.anzahl_hilfreich || 0})
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleRating(selectedSolution.id, false)}
                                    className="flex-1"
                                >
                                    <ThumbsDown className="w-4 h-4 mr-2" />
                                    Nein ({selectedSolution.anzahl_nicht_hilfreich || 0})
                                </Button>
                            </div>
                            {selectedSolution.hilfreich_prozent && (
                                <p className="text-sm text-slate-600 text-center mt-2">
                                    {selectedSolution.hilfreich_prozent}% fanden dies hilfreich
                                </p>
                            )}
                        </div>

                        <div className="bg-slate-50 p-6 rounded-lg text-center">
                            <p className="font-semibold mb-3">💬 Noch Fragen?</p>
                            <Button onClick={() => setReportDialogOpen(true)}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Problem melden
                            </Button>
                        </div>
                    </CardContent>
                    </Card>
                    </motion.div>
                    </motion.div>
                    );
                    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between py-8"
            >
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">📚 Hilfe-Center</h1>
                    <p className="text-lg text-slate-600">Finden Sie schnell Antworten auf Ihre Fragen</p>
                </div>
                {isAdmin && (
                    <Button 
                        onClick={() => {
                            setEditingSolution(null);
                            setShowSolutionEditor(true);
                        }}
                        variant="outline"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Neue Lösung
                    </Button>
                    )}
                    </motion.div>

                    {/* Suche */}
                    <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    >
                    <Card>
                <CardContent className="p-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Wonach suchen Sie?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-14 text-lg"
                        />
                    </div>
                    </CardContent>
                    </Card>
                    </motion.div>

                    {/* Häufigste Fragen */}
                    <AnimatePresence>
                    {!searchQuery && (
                    <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: 0.2 }}
                    >
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">💡 Häufigste Fragen</h2>
                    <div className="grid gap-3">
                        {topSolutions.map((solution, idx) => (
                            <motion.div
                                key={solution.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ scale: 1.01 }}
                            >
                            <Card
                                className="cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => handleViewSolution(solution)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-900 mb-1">
                                                {solution.titel}
                                            </h3>
                                            <p className="text-sm text-slate-600 line-clamp-2">
                                                {solution.beschreibung}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 text-xs text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                {solution.anzahl_aufrufe || 0}
                                            </div>
                                            {solution.hilfreich_prozent && (
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                    {solution.hilfreich_prozent}%
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                                </Card>
                                </motion.div>
                                ))}
                                </div>
                                </motion.div>
                                )}
                                </AnimatePresence>

            {/* Kategorien */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h2 className="text-2xl font-bold text-slate-900 mb-4">📂 Kategorien</h2>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={selectedCategory === 'Alle' ? 'default' : 'outline'}
                        onClick={() => setSelectedCategory('Alle')}
                        className={selectedCategory === 'Alle' ? 'bg-emerald-600' : ''}
                    >
                        Alle
                    </Button>
                    {categories.map(cat => (
                        <motion.div
                            key={cat}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button
                                variant={selectedCategory === cat ? 'default' : 'outline'}
                                onClick={() => setSelectedCategory(cat)}
                                className={selectedCategory === cat ? 'bg-emerald-600' : ''}
                            >
                                {cat}
                            </Button>
                        </motion.div>
                        ))}
                        </div>
                        </motion.div>

            {/* Lösungen-Liste */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    {searchQuery ? 'Suchergebnisse' : 'Alle Artikel'} ({filteredSolutions.length})
                </h2>
                {isLoading ? (
                    <div className="text-center py-12 text-slate-600">Lade Artikel...</div>
                ) : filteredSolutions.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <HelpCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                Keine Artikel gefunden
                            </h3>
                            <p className="text-slate-600 mb-6">
                                Versuchen Sie andere Suchbegriffe oder melden Sie Ihr Problem
                            </p>
                            <Button onClick={() => setReportDialogOpen(true)}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Problem melden
                            </Button>
                            </CardContent>
                            </Card>
                            </motion.div>
                ) : (
                    <div className="grid gap-3">
                        <AnimatePresence>
                            {filteredSolutions.map((solution, idx) => (
                                <motion.div
                                    key={solution.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.03 }}
                                    whileHover={{ scale: 1.01 }}
                                >
                                <Card
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => handleViewSolution(solution)}
                                >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-900 mb-1">
                                                {solution.titel}
                                            </h3>
                                            <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                                                {solution.beschreibung}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {solution.schwierigkeitsgrad && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {solution.schwierigkeitsgrad}
                                                    </Badge>
                                                )}
                                                {solution.gilt_fuer_kategorien?.map(cat => (
                                                    <Badge key={cat} variant="outline" className="text-xs">
                                                        {cat}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 text-xs text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                {solution.anzahl_aufrufe || 0}
                                            </div>
                                            {solution.hilfreich_prozent && (
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                    {solution.hilfreich_prozent}%
                                                </div>
                                            )}
                                            {solution.geschaetzte_dauer_minuten && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {solution.geschaetzte_dauer_minuten} min
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                                </Card>
                                </motion.div>
                                ))}
                                </AnimatePresence>
                                </div>
                                )}
                                </motion.div>

            {/* Problem nicht gefunden */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6 text-center">
                    <HelpCircle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Problem nicht gefunden?
                    </h3>
                    <p className="text-slate-600 mb-4">
                        Melden Sie Ihr Problem und wir helfen Ihnen schnellstmöglich
                    </p>
                    <Button onClick={() => setReportDialogOpen(true)}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Problem melden
                    </Button>
                </CardContent>
            </Card>

            {/* Dialoge */}
            <ReportProblemDialog
                open={reportDialogOpen}
                onOpenChange={setReportDialogOpen}
            />

            {isAdmin && (
                <SolutionEditor
                    open={showSolutionEditor}
                    onOpenChange={setShowSolutionEditor}
                    solution={editingSolution}
                />
            )}
        </div>
    );
}