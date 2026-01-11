import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import FieldPermissionManager from '@/components/permissions/FieldPermissionManager';

export default function RoleManagementPage() {
    const [isInitializing, setIsInitializing] = useState(false);

    const { data: roles, isLoading: isLoadingRoles } = useQuery({
        queryKey: ['roles:management'],
        queryFn: () => base44.entities.RoleDefinition.list()
    });

    const handleInitializeSystem = async () => {
        setIsInitializing(true);
        try {
            const response = await base44.functions.invoke('initializePermissionSystem', {});
            toast.success(response.data.message);
        } catch (error) {
            toast.error('Fehler beim Initialisieren: ' + error.message);
        } finally {
            setIsInitializing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Rollenverwaltung</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Verwalten Sie Rollen und Feldberechtigungen für granulare Zugriffskontrolle.
                </p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Systeminit ialisierung</CardTitle>
                    <Button 
                        onClick={handleInitializeSystem}
                        disabled={isInitializing}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isInitializing ? 'Wird initialisiert...' : 'System initialisieren'}
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-600">
                        Klicken Sie hier, um Rollendefinitionen und standard Feldberechtigungen zu erstellen.
                    </p>
                </CardContent>
            </Card>

            <Tabs defaultValue="roles" className="w-full">
                <TabsList>
                    <TabsTrigger value="roles">Rollen</TabsTrigger>
                    <TabsTrigger value="fields">Feldberechtigungen</TabsTrigger>
                </TabsList>

                <TabsContent value="roles">
                    <Card>
                        <CardContent className="pt-6">
                            {isLoadingRoles ? (
                                <p>Wird geladen...</p>
                            ) : roles?.length === 0 ? (
                                <p className="text-slate-500">Keine Rollen definiert. Initialisieren Sie das System.</p>
                            ) : (
                                <div className="space-y-4">
                                    {roles?.map(role => (
                                        <div key={role.id} className="p-4 border border-slate-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-semibold">{role.role_name}</h3>
                                                {role.is_system_role && (
                                                    <Badge variant="secondary">System</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 mb-3">{role.description}</p>
                                            <div className="flex gap-2 flex-wrap">
                                                <Badge variant="outline">
                                                    Gebäude: {role.building_access}
                                                </Badge>
                                                <Badge variant="outline">
                                                    Standard: {role.default_field_access}
                                                </Badge>
                                            </div>
                                            {role.allowed_actions?.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-slate-200">
                                                    <p className="text-xs text-slate-500 mb-2">Erlaubte Aktionen:</p>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {role.allowed_actions.map(action => (
                                                            <Badge key={action} className="bg-green-100 text-green-800">
                                                                {action}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="fields">
                    <FieldPermissionManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}