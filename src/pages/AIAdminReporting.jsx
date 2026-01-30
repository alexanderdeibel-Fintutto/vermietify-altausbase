import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AIReportingDashboard from '../components/ai/AIReportingDashboard';
import AISystemPromptManager from '../components/ai/AISystemPromptManager';
import AIWorkflowBuilder from '../components/ai/AIWorkflowBuilder';
import AIBudgetOverview from '../components/ai/AIBudgetOverview';

export default function AIAdminReporting() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    async function loadUser() {
        const u = await base44.auth.me();
        setUser(u);
    }

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Zugriff verweigert</h1>
                    <p className="text-slate-600">Diese Seite ist nur für Administratoren verfügbar.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">AI Administration & Reporting</h1>

            <Tabs defaultValue="dashboard">
                <TabsList className="mb-6">
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="budget">Budget</TabsTrigger>
                    <TabsTrigger value="workflows">Workflows</TabsTrigger>
                    <TabsTrigger value="prompts">System-Prompts</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard">
                    <AIReportingDashboard />
                </TabsContent>

                <TabsContent value="budget">
                    <AIBudgetOverview />
                </TabsContent>

                <TabsContent value="workflows">
                    <AIWorkflowBuilder />
                </TabsContent>

                <TabsContent value="prompts">
                    <AISystemPromptManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}