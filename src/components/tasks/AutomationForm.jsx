import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from 'lucide-react';

export default function AutomationForm({ open, onOpenChange, onSubmit, initialData, isLoading }) {
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        defaultValues: initialData || {
            trigger_type: 'time_based',
            action_type: 'create_task',
            trigger_config: {},
            action_config: {},
            is_active: true
        }
    });

    useEffect(() => {
        if (open) {
            reset(initialData || {
                trigger_type: 'time_based',
                action_type: 'create_task',
                trigger_config: {},
                action_config: {},
                is_active: true
            });
        }
    }, [open, initialData, reset]);

    const triggerType = watch('trigger_type');
    const actionType = watch('action_type');
    const isActive = watch('is_active');

    const handleFormSubmit = (data) => {
        onSubmit({
            ...data,
            trigger_config: data.trigger_config || {},
            action_config: data.action_config || {}
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Automatisierung bearbeiten' : 'Neue Automatisierung'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            {...register('name', { required: true })}
                            placeholder="z.B. Zahlungserinnerung"
                            className={errors.name ? 'border-red-500' : ''}
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Beschreibung</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Was macht diese Automatisierung?"
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="trigger_type">Trigger-Typ *</Label>
                            <select
                                id="trigger_type"
                                {...register('trigger_type', { required: true })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="time_based">Zeitgesteuert</option>
                                <option value="status_change">Status-Änderung</option>
                                <option value="document_action">Dokument-Aktion</option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="action_type">Aktion *</Label>
                            <select
                                id="action_type"
                                {...register('action_type', { required: true })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="create_task">Task erstellen</option>
                                <option value="send_email">Email versenden</option>
                                <option value="update_document">Dokument aktualisieren</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="is_active"
                            checked={isActive}
                            onCheckedChange={(checked) => setValue('is_active', checked)}
                        />
                        <label
                            htmlFor="is_active"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Automatisierung aktiv
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
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