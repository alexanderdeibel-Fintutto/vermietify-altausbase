import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Package, Star } from 'lucide-react';

export default function SuiteSwitcher() {
    const { data: userSuites, isLoading } = useQuery({
        queryKey: ['user-active-suites'],
        queryFn: async () => {
            const response = await base44.functions.invoke('getUserActiveSuites');
            return response.data;
        }
    });

    if (isLoading || !userSuites?.suites || userSuites.suites.length === 0) {
        return null;
    }

    const activeSuite = userSuites.suites[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Package className="w-4 h-4" />
                    <span className="font-medium">{activeSuite.display_name}</span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Ihre Suites</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userSuites.suites.map((suite) => (
                    <DropdownMenuItem key={suite.id} className="flex items-start gap-3 p-3">
                        <Package className="w-5 h-5 mt-0.5 text-emerald-600" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{suite.display_name}</span>
                                {suite.subscription.status === 'trial' && (
                                    <Badge variant="secondary" className="text-xs">Trial</Badge>
                                )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{suite.description}</p>
                            <p className="text-xs text-slate-500 mt-1">
                                {suite.included_modules?.length || 0} Module
                            </p>
                        </div>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-emerald-600">
                    <Star className="w-4 h-4 mr-2" />
                    Suite hinzubuchen
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}