import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactQuill from 'react-quill';
import { toast } from 'sonner';

const CATEGORIES = [
    'Höflichkeitsformeln',
    'Kündigungsgründe',
    'Rechtliche Klauseln',
    'Mahnungstexte',
    'Mieterhöhungsbegründungen',
    'Sonstiges'
];

export default function TextBlockEditor({ open, onOpenChange, initialData }) {
    const [formData, setFormData] = useState(initialData || {
        name: '',
        category: 'Höflichkeitsformeln',
        content: ''
    });
    const queryClient = useQueryClient();

    React.useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                category: 'Höflichkeitsformeln',
                content: ''
            });
        }
    }, [initialData, open]);

    const saveMutation = useMutation({
        mutationFn: (data) => {
            if (initialData?.id) {
                return base44.entities.TextBlock.update(initialData.id, data);
            }
            return base44.entities.TextBlock.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['textBlocks'] });
            toast.success(initialData ? 'Textbaustein aktualisiert' : 'Textbaustein erstellt');
            onOpenChange(false);
        }
    });

    const handleSave = () => {
        if (!formData.name || !formData.content) {
            toast.error('Name und Inhalt sind erforderlich');
            return;
        }
        saveMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Textbaustein bearbeiten' : 'Neuer Textbaustein'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Name</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="z.B. Höfliche Anrede"
                        />
                    </div>

                    <div>
                        <Label>Kategorie</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Inhalt</Label>
                        <ReactQuill
                            theme="snow"
                            value={formData.content}
                            onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                            className="bg-white"
                            style={{ height: '300px', marginBottom: '50px' }}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t mt-16">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Abbrechen
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={saveMutation.isPending}
                    >
                        {saveMutation.isPending ? 'Speichert...' : 'Speichern'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}