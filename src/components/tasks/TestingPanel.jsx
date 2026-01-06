import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TestTube, Database, Zap, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TestingPanel() {
    const [testResults, setTestResults] = useState(null);

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me()
    });

    const generateTestDataMutation = useMutation({
        mutationFn: async ({ scenario, count }) => {
            const response = await base44.functions.invoke('generateTestData', { scenario, count });
            return response.data;
        },
        onSuccess: (data) => {
            setTestResults(data.results);
            toast.success(data.message);
        },
        onError: (error) => {
            toast.error('Fehler: ' + error.message);
        }
    });

    const performanceTestMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.functions.invoke('optimizePerformance');
            return response.data;
        },
        onSuccess: (data) => {
            toast.success('Performance-Test abgeschlossen');
        }
    });

    if (user?.role !== 'admin') {
        return null;
    }

    const testScenarios = [
        {
            id: 'workflows',
            title: 'Test-Workflows',
            description: 'Erstellt Standard-Workflows für verschiedene Szenarien',
            icon: Zap,
            color: 'bg-purple-100 text-purple-600'
        },
        {
            id: 'tasks',
            title: 'Test-Tasks',
            description: 'Generiert realistische Tasks mit verschiedenen Status',
            icon: CheckCircle2,
            color: 'bg-blue-100 text-blue-600'
        },
        {
            id: 'emails',
            title: 'Test-Emails',
            description: 'Erstellt Test-Emails für Email-Integration',
            icon: Mail,
            color: 'bg-green-100 text-green-600'
        },
        {
            id: 'automations',
            title: 'Test-Automatisierungen',
            description: 'Erstellt deaktivierte Test-Automatisierungen',
            icon: Database,
            color: 'bg-orange-100 text-orange-600'
        },
        {
            id: 'all',
            title: 'Alle Test-Daten',
            description: 'Erstellt komplettes Test-Set',
            icon: TestTube,
            color: 'bg-emerald-100 text-emerald-600'
        }
    ];

    return (
        <div className="space-y-6">
            <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                            <TestTube className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle>Testing & Development</CardTitle>
                            <p className="text-sm text-slate-600 mt-1">
                                Nur für Admin-Benutzer sichtbar
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {testScenarios.map((scenario) => {
                            const Icon = scenario.icon;
                            return (
                                <Card key={scenario.id} className="border-slate-200">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`w-10 h-10 ${scenario.color} rounded-lg flex items-center justify-center`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <h3 className="font-semibold text-slate-800 mb-1">
                                            {scenario.title}
                                        </h3>
                                        <p className="text-sm text-slate-600 mb-3">
                                            {scenario.description}
                                        </p>
                                        <Button
                                            size="sm"
                                            onClick={() => generateTestDataMutation.mutate({ 
                                                scenario: scenario.id, 
                                                count: scenario.id === 'tasks' ? 20 : 10 
                                            })}
                                            disabled={generateTestDataMutation.isPending}
                                            className="w-full"
                                        >
                                            {generateTestDataMutation.isPending && (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            )}
                                            Generieren
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Test Results */}
                    {testResults && (
                        <Card className="border-green-200 bg-green-50">
                            <CardContent className="p-4">
                                <h3 className="font-semibold text-green-900 mb-3">
                                    ✓ Test-Daten erfolgreich erstellt
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-green-700">Workflows</p>
                                        <p className="text-2xl font-bold text-green-900">
                                            {testResults.workflows_created}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-green-700">Tasks</p>
                                        <p className="text-2xl font-bold text-green-900">
                                            {testResults.tasks_created}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-green-700">Emails</p>
                                        <p className="text-2xl font-bold text-green-900">
                                            {testResults.emails_created}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-green-700">Automatisierungen</p>
                                        <p className="text-2xl font-bold text-green-900">
                                            {testResults.automations_created}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Performance Tests */}
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-semibold text-slate-800 mb-3">
                                Performance-Tests
                            </h3>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => performanceTestMutation.mutate()}
                                    disabled={performanceTestMutation.isPending}
                                >
                                    {performanceTestMutation.isPending && (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    )}
                                    Performance analysieren
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    );
}