import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, AlertCircle } from 'lucide-react';

export default function ModuleAccessGuard({ moduleName, children, fallback }) {
    const { data: access, isLoading } = useQuery({
        queryKey: ['module-access', moduleName],
        queryFn: async () => {
            const response = await base44.functions.invoke('checkUserModuleAccess', {
                module_name: moduleName
            });
            return response.data;
        }
    });

    if (isLoading) {
        return <div className="animate-pulse bg-slate-100 h-32 rounded-lg" />;
    }

    if (!access?.has_access) {
        if (fallback) {
            return fallback;
        }

        return (
            <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-6 text-center">
                    <Lock className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-amber-900 mb-2">
                        Modul nicht verfügbar
                    </h3>
                    <p className="text-amber-800 mb-4">
                        Dieses Modul ist in Ihrer aktuellen Suite nicht enthalten.
                    </p>
                    <Button className="bg-amber-600 hover:bg-amber-700">
                        Modul hinzubuchen
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return children;
}