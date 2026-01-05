import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mail, Search, CheckCircle, Clock, Sparkles, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

export default function EmailList({ onCreateTask }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [analyzingEmail, setAnalyzingEmail] = useState(null);
    const queryClient = useQueryClient();

    const { data: emails = [], isLoading } = useQuery({
        queryKey: ['emails'],
        queryFn: () => base44.entities.Email.list('-received_date')
    });

    const analyzeMutation = useMutation({
        mutationFn: async (emailId) => {
            setAnalyzingEmail(emailId);
            const response = await base44.functions.invoke('analyzeEmailForTask', { email_id: emailId });
            return { emailId, suggestion: response.data };
        },
        onSuccess: ({ emailId, suggestion }) => {
            queryClient.invalidateQueries({ queryKey: ['emails'] });
            toast.success('Task-Vorschlag erstellt');
            setAnalyzingEmail(null);
        },
        onError: (error) => {
            toast.error('Analyse fehlgeschlagen: ' + error.message);
            setAnalyzingEmail(null);
        }
    });

    const createTaskMutation = useMutation({
        mutationFn: async (email) => {
            const taskData = {
                title: email.ai_suggested_task?.title || `Email: ${email.subject}`,
                description: email.ai_suggested_task?.description || email.body_text?.substring(0, 500),
                status: 'offen',
                priority_id: email.ai_suggested_task?.priority_id,
                due_date: email.ai_suggested_task?.due_date,
                email_id: email.id
            };
            const task = await base44.entities.Task.create(taskData);
            await base44.entities.Email.update(email.id, { has_task: true, is_processed: true });
            return task;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emails'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Task erstellt');
        }
    });

    const filteredEmails = emails.filter(email => {
        const matchesSearch = email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            email.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            email.sender_email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'processed' && email.is_processed) ||
                            (statusFilter === 'unprocessed' && !email.is_processed) ||
                            (statusFilter === 'has_task' && email.has_task);
        return matchesSearch && matchesStatus;
    });

    const handleAnalyze = (email) => {
        analyzeMutation.mutate(email.id);
    };

    const handleCreateTask = (email) => {
        if (email.ai_suggested_task) {
            createTaskMutation.mutate(email);
        } else {
            onCreateTask({
                title: `Email: ${email.subject}`,
                description: email.body_text?.substring(0, 500),
                email_id: email.id
            });
        }
    };

    if (isLoading) {
        return <div className="text-center py-8 text-slate-500">Lade Emails...</div>;
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Emails durchsuchen..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="all">Alle Emails</option>
                            <option value="unprocessed">Unbearbeitet</option>
                            <option value="processed">Verarbeitet</option>
                            <option value="has_task">Mit Task</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {filteredEmails.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Mail className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Keine Emails gefunden</h3>
                        <p className="text-slate-600">Synchronisieren Sie Ihre Email-Konten</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredEmails.map((email) => (
                        <Card key={email.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-800 mb-1">
                                                    {email.subject}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <span className="font-medium">{email.sender_name || email.sender_email}</span>
                                                    <span>•</span>
                                                    <span>{format(parseISO(email.received_date), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {email.has_task && (
                                                    <Badge className="bg-green-100 text-green-700">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Task erstellt
                                                    </Badge>
                                                )}
                                                {email.is_processed && !email.has_task && (
                                                    <Badge variant="outline">Verarbeitet</Badge>
                                                )}
                                            </div>
                                        </div>

                                        {email.body_text && (
                                            <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                                                {email.body_text.substring(0, 200)}...
                                            </p>
                                        )}

                                        {email.ai_suggested_task && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                                <div className="flex items-start gap-2">
                                                    <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-blue-900 mb-1">
                                                            KI-Vorschlag: {email.ai_suggested_task.title}
                                                        </p>
                                                        {email.ai_suggested_task.description && (
                                                            <p className="text-xs text-blue-700">
                                                                {email.ai_suggested_task.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            {!email.ai_suggested_task && !email.has_task && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAnalyze(email)}
                                                    disabled={analyzingEmail === email.id}
                                                >
                                                    {analyzingEmail === email.id ? (
                                                        <>
                                                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                                                            Analysiere...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="w-4 h-4 mr-2" />
                                                            KI-Analyse
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                            {!email.has_task && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleCreateTask(email)}
                                                    disabled={createTaskMutation.isPending}
                                                    className="bg-emerald-600 hover:bg-emerald-700"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Task erstellen
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}