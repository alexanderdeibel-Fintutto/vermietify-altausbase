import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from 'lucide-react';

const colorOptions = [
    { value: '#10b981', label: 'Grün' },
    { value: '#3b82f6', label: 'Blau' },
    { value: '#8b5cf6', label: 'Lila' },
    { value: '#f59e0b', label: 'Orange' },
    { value: '#ef4444', label: 'Rot' },
    { value: '#6366f1', label: 'Indigo' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#64748b', label: 'Grau' },
];

export default function CategoryForm({ open, onOpenChange, onSubmit, initialData, isLoading }) {
    const { register, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: initialData || { color: '#10b981' }
    });

    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({ color: '#10b981' });
        }
    }, [initialData, reset]);

    const selectedColor = watch('color');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Kategorie bearbeiten' : 'Neue Kategorie erstellen'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="name">Kategoriename *</Label>
                        <Input 
                            id="name"
                            {...register('name', { required: true })}
                            placeholder="z.B. Mieteinnahmen"
                        />
                    </div>

                    <div>
                        <Label>Farbe</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            {colorOptions.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setValue('color', color.value)}
                                    className={`h-12 rounded-lg border-2 transition-all ${
                                        selectedColor === color.value 
                                            ? 'border-slate-800 scale-105' 
                                            : 'border-slate-200 hover:border-slate-400'
                                    }`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.label}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="keywords">Schlüsselwörter (optional)</Label>
                        <Textarea 
                            id="keywords"
                            {...register('keywords')}
                            placeholder="Kommagetrennte Wörter für automatische Kategorisierung, z.B. Miete, Wohnung, Kaution"
                            rows={3}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Transaktionen mit diesen Wörtern werden automatisch dieser Kategorie zugeordnet
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button 
                            type="submit" 
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {initialData ? 'Speichern' : 'Erstellen'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}