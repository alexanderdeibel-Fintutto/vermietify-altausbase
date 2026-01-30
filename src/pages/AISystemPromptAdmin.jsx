import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Eye, EyeOff, Copy } from 'lucide-react';
import { toast } from 'sonner';
import AISystemPromptEditor from '../components/ai/AISystemPromptEditor';
import AIPromptPreview from '../components/ai/AIPromptPreview';

export default function AISystemPromptAdmin() {
    const [showEditor, setShowEditor] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState(null);
    const [selectedPrompt, setSelectedPrompt] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const user = React.useContext(require('@/components/auth/AuthContext')?.AuthContext) || {};

    // Nur Admin hat Zugriff
    React.useEffect(() => {
        (async () => {
            const currentUser = await base44.auth.me();
            if (currentUser?.role !== 'admin') {
                window.location.href = '/Dashboard';
            }
        })();
    }, []);

    const { data: prompts = [], refetch, isLoading } = useQuery({
        queryKey: ['systemPrompts'],
        queryFn: () => base44.entities.AISystemPrompt.list('-created_date')
    });

    const filteredPrompts = prompts.filter(p =>
        p.custom_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.feature_key.toLowerCase().includes(searchTerm.toLowerCase())
    );

    async function handleSave(promptData) {
        try {
            if (editingPrompt?.id) {
                await base44.entities.AISystemPrompt.update(editingPrompt.id, {
                    ...promptData,
                    last_modified_by: user.email || 'admin'
                });
                toast.success('Prompt aktualisiert');
            } else {
                await base44.entities.AISystemPrompt.create({
                    ...promptData,
                    created_by_email: user.email || 'admin',
                    usage_count: 0
                });
                toast.success('Prompt erstellt');
            }
            refetch();
            setShowEditor(false);
            setEditingPrompt(null);
        } catch (error) {
            toast.error(error.message);
        }
    }

    async function handleToggleActive(id, currentState) {
        try {
            await base44.entities.AISystemPrompt.update(id, { is_active: !currentState });
            refetch();
            toast.success(currentState ? 'Prompt deaktiviert' : 'Prompt aktiviert');
        } catch (error) {
            toast.error('Fehler');
        }
    }

    async function handleDelete(id) {
        if (!confirm('Wirklich löschen?')) return;
        try {
            await base44.entities.AISystemPrompt.delete(id);
            refetch();
            setSelectedPrompt(null);
            toast.success('Prompt gelöscht');
        } catch (error) {
            toast.error('Fehler beim Löschen');
        }
    }

    async function handleDuplicate(prompt) {
        try {
            await base44.entities.AISystemPrompt.create({
                ...prompt,
                custom_name: `${prompt.custom_name} (Kopie)`,
                created_by_email: user.email || 'admin',
                usage_count: 0
            });
            refetch();
            toast.success('Prompt kopiert');
        } catch (error) {
            toast.error('Fehler beim Kopieren');
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">AI System Prompts</h1>
                        <p className="text-slate-600 mt-2">Verwalte Custom Prompts für verschiedene AI-Features</p>
                    </div>
                    <Button
                        onClick={() => {
                            setEditingPrompt(null);
                            setShowEditor(true);
                        }}
                        className="vf-btn-gradient"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Neuer Prompt
                    </Button>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-3xl font-bold">{prompts.length}</div>
                            <div className="text-sm text-slate-600">Insgesamt Prompts</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-3xl font-bold text-green-600">
                                {prompts.filter(p => p.is_active).length}
                            </div>
                            <div className="text-sm text-slate-600">Aktiv</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-3xl font-bold text-blue-600">
                                {prompts.reduce((sum, p) => sum + (p.usage_count || 0), 0)}
                            </div>
                            <div className="text-sm text-slate-600">Gesamt-Nutzungen</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-3xl font-bold text-purple-600">
                                {new Set(prompts.map(p => p.feature_key)).size}
                            </div>
                            <div className="text-sm text-slate-600">Features</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {/* Liste */}
                    <div className="col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nach Name oder Feature suchen..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="vf-input flex-1"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="text-center py-8 text-slate-500">Lädt...</div>
                                ) : filteredPrompts.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">
                                        Keine Prompts gefunden
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredPrompts.map(prompt => (
                                            <div
                                                key={prompt.id}
                                                onClick={() => setSelectedPrompt(prompt)}
                                                className={`p-4 border rounded-lg cursor-pointer transition ${
                                                    selectedPrompt?.id === prompt.id
                                                        ? 'bg-blue-50 border-blue-300'
                                                        : 'bg-white hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-900">
                                                            {prompt.custom_name}
                                                        </div>
                                                        <div className="flex gap-2 mt-2">
                                                            <Badge variant="outline">
                                                                {prompt.feature_key}
                                                            </Badge>
                                                            {prompt.is_active ? (
                                                                <Badge className="bg-green-100 text-green-800">
                                                                    Aktiv
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline">Inaktiv</Badge>
                                                            )}
                                                            <span className="text-xs text-slate-500">
                                                                {prompt.usage_count || 0}x genutzt
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleActive(prompt.id, prompt.is_active);
                                                            }}
                                                        >
                                                            {prompt.is_active ? (
                                                                <EyeOff className="w-4 h-4" />
                                                            ) : (
                                                                <Eye className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingPrompt(prompt);
                                                                setShowEditor(true);
                                                            }}
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDuplicate(prompt);
                                                            }}
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(prompt.id);
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Editor & Vorschau */}
                    <div className="col-span-1 space-y-4">
                        {showEditor ? (
                            <AISystemPromptEditor
                                prompt={editingPrompt}
                                onSave={handleSave}
                                onCancel={() => {
                                    setShowEditor(false);
                                    setEditingPrompt(null);
                                }}
                            />
                        ) : selectedPrompt ? (
                            <AIPromptPreview prompt={selectedPrompt} />
                        ) : (
                            <Card>
                                <CardContent className="pt-6 text-center text-slate-500">
                                    Wähle einen Prompt zum Anzeigen oder erstelle einen neuen
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}