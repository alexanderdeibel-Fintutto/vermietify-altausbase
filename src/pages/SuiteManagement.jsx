import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, CheckCircle, Lock, Settings, Users, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function SuiteManagement() {
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);

    React.useEffect(() => {
        base44.auth.me().then(setUser);
    }, []);

    const { data: userSuites } = useQuery({
        queryKey: ['user-active-suites'],
        queryFn: async () => {
            const response = await base44.functions.invoke('getUserActiveSuites');
            return response.data;
        }
    });

    const { data: allSuites } = useQuery({
        queryKey: ['all-suites'],
        queryFn: () => base44.entities.AppSuite.list()
    });

    const { data: allModules } = useQuery({
        queryKey: ['all-modules'],
        queryFn: () => base44.entities.ModuleDefinition.list()
    });

    const seedMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.functions.invoke('seedSuiteData');
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries();
            toast.success(`${data.modules_created} Module und ${data.suites_created} Suites erstellt`);
        }
    });

    const isAdmin = user?.role === 'admin';

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Suite Management</h1>
                    <p className="text-slate-600 mt-2">Verwalten Sie Ihre Suites und Module</p>
                </div>
                {isAdmin && (
                    <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
                        <Play className="w-4 h-4 mr-2" />
                        Initial Data Seeden
                    </Button>
                )}
            </div>

            <Tabs defaultValue="my-suites">
                <TabsList>
                    <TabsTrigger value="my-suites">Meine Suites</TabsTrigger>
                    <TabsTrigger value="all-suites">Alle Suites</TabsTrigger>
                    <TabsTrigger value="modules">Module</TabsTrigger>
                    {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
                </TabsList>

                <TabsContent value="my-suites" className="space-y-4 mt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {userSuites?.suites?.map((suite) => (
                            <Card key={suite.id} className="border-emerald-200">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Package className="w-8 h-8 text-emerald-600" />
                                            <div>
                                                <CardTitle>{suite.display_name}</CardTitle>
                                                <Badge className="mt-1">{suite.price_tier}</Badge>
                                            </div>
                                        </div>
                                        {suite.subscription.status === 'trial' && (
                                            <Badge variant="secondary">Trial</Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-600 mb-4">{suite.description}</p>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Enthaltene Module:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {suite.included_modules?.map((mod) => (
                                                <Badge key={mod} variant="outline">
                                                    <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                                                    {mod}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {userSuites?.modules?.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Zusätzliche Module</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {userSuites.modules.map((mod) => (
                                        <div key={mod.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                            <Settings className="w-5 h-5 text-slate-400" />
                                            <div className="flex-1">
                                                <p className="font-medium">{mod.display_name}</p>
                                                <p className="text-xs text-slate-600">
                                                    via {mod.access.granted_via}
                                                </p>
                                            </div>
                                            <Badge variant="outline">{mod.access.access_level}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="all-suites" className="space-y-4 mt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {allSuites?.map((suite) => {
                            const hasAccess = userSuites?.suites?.some(s => s.id === suite.id);
                            return (
                                <Card key={suite.id} className={hasAccess ? 'border-emerald-200' : ''}>
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            {hasAccess ? (
                                                <CheckCircle className="w-6 h-6 text-green-600" />
                                            ) : (
                                                <Lock className="w-6 h-6 text-slate-400" />
                                            )}
                                            <div>
                                                <CardTitle className="text-lg">{suite.display_name}</CardTitle>
                                                <Badge className="mt-1">{suite.price_tier}</Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-slate-600 mb-3">{suite.description}</p>
                                        <p className="text-xs text-slate-500 mb-2">
                                            {suite.included_modules?.length || 0} Module enthalten
                                        </p>
                                        {!hasAccess && (
                                            <Button size="sm" className="w-full">Suite buchen</Button>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="modules" className="space-y-4 mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {allModules?.map((mod) => {
                            const hasAccess = userSuites?.modules?.some(m => m.id === mod.id);
                            return (
                                <Card key={mod.id} className={hasAccess ? 'border-emerald-200' : ''}>
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            {hasAccess ? (
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <Lock className="w-5 h-5 text-slate-400" />
                                            )}
                                            <CardTitle className="text-base">{mod.display_name}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <Badge>{mod.category}</Badge>
                                            <Badge variant="outline">{mod.addon_price_tier}</Badge>
                                            {!hasAccess && (
                                                <Button size="sm" variant="outline" className="w-full mt-2">
                                                    Hinzubuchen
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="admin" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Admin-Verwaltung
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600">
                                    Admin-Funktionen für Modul-Zugriff und Suite-Verwaltung.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}