import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from 'lucide-react';

export default function WorkflowForm({ open, onOpenChange, onSubmit, initialData, isLoading }) {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: initialData || {
            is_active: true,
            is_default: false
        }
    });

    useEffect(() => {
        if (open) {
            reset(initialData || {
                is_active: true,
                is_default: false
            });
        }
    }, [open, initialData, reset]);

    const isActive = watch('is_active');
    const isDefault = watch('is_default');

    const handleFormSubmit = (data) => {
        onSubmit(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Workflow bearbeiten' : 'Neuer Workflow'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="name">Workflow-Name *</Label>
                        <Input
                            id="name"
                            {...register('name', { required: true })}
                            placeholder="z.B. Mahnung Prozess"
                            className={errors.name ? 'border-red-500' : ''}
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Beschreibung</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Was macht dieser Workflow?"
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label htmlFor="document_type">Dokumenttyp</Label>
                        <Input
                            id="document_type"
                            {...register('document_type')}
                            placeholder="z.B. Mahnung, Kündigung"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Optional: Zugehöriger Dokumenttyp
                        </p>
                    </div>

                    <div className="flex items-center justify-between py-2 border-t">
                        <div className="space-y-1">
                            <Label htmlFor="is_active">Workflow aktiv</Label>
                            <p className="text-xs text-slate-500">
                                Nur aktive Workflows können ausgeführt werden
                            </p>
                        </div>
                        <Switch
                            id="is_active"
                            checked={isActive}
                            onCheckedChange={(checked) => setValue('is_active', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between py-2 border-t">
                        <div className="space-y-1">
                            <Label htmlFor="is_default">Standard-Workflow</Label>
                            <p className="text-xs text-slate-500">
                                Wird automatisch bei Erstellung vorgeschlagen
                            </p>
                        </div>
                        <Switch
                            id="is_default"
                            checked={isDefault}
                            onCheckedChange={(checked) => setValue('is_default', checked)}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Abbrechen
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-emerald-600 hover:bg-emerald-700"
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