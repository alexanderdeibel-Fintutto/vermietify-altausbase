import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from 'lucide-react';
import TextBlockEditor from './TextBlockEditor';

export default function TextBlocksList() {
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingBlock, setEditingBlock] = useState(null);
    const [filterCategory, setFilterCategory] = useState('all');
    const queryClient = useQueryClient();

    const { data: textBlocks = [], isLoading } = useQuery({
        queryKey: ['textBlocks'],
        queryFn: () => base44.entities.TextBlock.list('-created_date')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.TextBlock.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['textBlocks'] })
    });

    const categories = ['Höflichkeitsformeln', 'Kündigungsgründe', 'Rechtliche Klauseln', 'Mahnungstexte', 'Mieterhöhungsbegründungen', 'Sonstiges'];

    const filteredBlocks = filterCategory === 'all' 
        ? textBlocks 
        : textBlocks.filter(b => b.category === filterCategory);

    const handleEdit = (block) => {
        setEditingBlock(block);
        setEditorOpen(true);
    };

    const handleNew = () => {
        setEditingBlock(null);
        setEditorOpen(true);
    };

    if (isLoading) {
        return <div className="text-center py-12 text-slate-500">Lädt...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Textbausteine</h2>
                    <p className="text-sm text-slate-600">Wiederverwendbare Text-Module für Ihre Dokumente</p>
                </div>
                <Button onClick={handleNew} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Neuer Textbaustein
                </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
                <Button
                    variant={filterCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterCategory('all')}
                >
                    Alle ({textBlocks.length})
                </Button>
                {categories.map(cat => {
                    const count = textBlocks.filter(b => b.category === cat).length;
                    return (
                        <Button
                            key={cat}
                            variant={filterCategory === cat ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterCategory(cat)}
                        >
                            {cat} ({count})
                        </Button>
                    );
                })}
            </div>

            <div className="grid gap-4">
                {filteredBlocks.map((block) => (
                    <Card key={block.id} className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-slate-800">{block.name}</h3>
                                    <Badge variant="outline">{block.category}</Badge>
                                    {block.is_system_block && (
                                        <Badge className="bg-blue-100 text-blue-700">System</Badge>
                                    )}
                                </div>
                                <div 
                                    className="text-sm text-slate-600 prose prose-sm max-w-none line-clamp-2"
                                    dangerouslySetInnerHTML={{ __html: block.content }}
                                />
                            </div>
                            <div className="flex gap-1 ml-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(block)}
                                >
                                    <Edit className="w-4 h-4 text-slate-600" />
                                </Button>
                                {!block.is_system_block && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            if (confirm('Textbaustein wirklich löschen?')) {
                                                deleteMutation.mutate(block.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}

                {filteredBlocks.length === 0 && (
                    <Card className="p-12 text-center">
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Keine Textbausteine</h3>
                        <p className="text-slate-600 mb-6">Erstellen Sie wiederverwendbare Textbausteine</p>
                        <Button onClick={handleNew} className="bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Ersten Textbaustein erstellen
                        </Button>
                    </Card>
                )}
            </div>

            <TextBlockEditor
                open={editorOpen}
                onOpenChange={setEditorOpen}
                initialData={editingBlock}
            />
        </div>
    );
}