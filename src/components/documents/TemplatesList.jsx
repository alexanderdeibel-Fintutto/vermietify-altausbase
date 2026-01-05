import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, Copy } from 'lucide-react';
import TemplateEditor from './TemplateEditor';

export default function TemplatesList() {
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const queryClient = useQueryClient();

    const { data: templates = [], isLoading } = useQuery({
        queryKey: ['templates'],
        queryFn: () => base44.entities.Template.list('-created_date')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Template.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] })
    });

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setEditorOpen(true);
    };

    const handleNew = () => {
        setEditingTemplate(null);
        setEditorOpen(true);
    };

    if (isLoading) {
        return <div className="text-center py-12 text-slate-500">Lädt...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Vorlagen</h2>
                    <p className="text-sm text-slate-600">Erstellen und verwalten Sie Dokumentenvorlagen</p>
                </div>
                <Button onClick={handleNew} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Neue Vorlage
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                    <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-800">{template.name}</h3>
                                    <Badge variant="outline" className="mt-1">{template.category}</Badge>
                                    {template.is_system_template && (
                                        <Badge className="mt-1 ml-1 bg-blue-100 text-blue-700">System</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="text-xs text-slate-600">
                                {template.required_data_sources?.length > 0 && (
                                    <p>Datenquellen: {template.required_data_sources.join(', ')}</p>
                                )}
                            </div>

                            <div className="flex gap-1 pt-2 border-t">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(template)}
                                    className="flex-1"
                                >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Bearbeiten
                                </Button>
                                {!template.is_system_template && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (confirm('Vorlage wirklich löschen?')) {
                                                deleteMutation.mutate(template.id);
                                            }
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}

                {templates.length === 0 && (
                    <Card className="col-span-full p-12 text-center">
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Noch keine Vorlagen</h3>
                        <p className="text-slate-600 mb-6">Erstellen Sie Ihre erste Dokumentenvorlage</p>
                        <Button onClick={handleNew} className="bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Erste Vorlage erstellen
                        </Button>
                    </Card>
                )}
            </div>

            <TemplateEditor
                open={editorOpen}
                onOpenChange={setEditorOpen}
                initialData={editingTemplate}
            />
        </div>
    );
}