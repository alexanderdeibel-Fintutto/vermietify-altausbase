import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from 'lucide-react';

export default function AutomationForm({ open, onOpenChange, onSubmit, initialData, isLoading }) {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: initialData || {
            is_active: true,
            trigger_type: 'time_based',
            action_type: 'create_task',
            trigger_config: {},
            action_config: {}
        }
    });

    useEffect(() => {
        if (open) {
            reset(initialData || {
                is_active: true,
                trigger_type: 'time_based',
                action_type: 'create_task',
                trigger_config: {},
                action_config: {}
            });
        }
    }, [open, initialData, reset]);

    const isActive = watch('is_active');
    const triggerType = watch('trigger_type');
    const actionType = watch('action_type');

    const handleFormSubmit = (data) => {
        // Parse JSON strings for configs
        let parsedData = { ...data };
        try {
            if (typeof data.trigger_config === 'string') {
                parsedData.trigger_config = JSON.parse(data.trigger_config || '{}');
            }
            if (typeof data.action_config === 'string') {
                parsedData.action_config = JSON.parse(data.action_config || '{}');
            }
        } catch (e) {
            console.error('JSON parse error:', e);
        }
        onSubmit(parsedData);
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
                            placeholder="z.B. Überfällige Zahlungen prüfen"
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
                                <option value="time_based">Zeitbasiert</option>
                                <option value="status_change">Statusänderung</option>
                                <option value="document_action">Dokumentaktion</option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="action_type">Aktions-Typ *</Label>
                            <select
                                id="action_type"
                                {...register('action_type', { required: true })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="create_task">Task erstellen</option>
                                <option value="send_email">Email senden</option>
                                <option value="update_document">Dokument aktualisieren</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="trigger_config">Trigger-Konfiguration (JSON)</Label>
                        <Textarea
                            id="trigger_config"
                            {...register('trigger_config')}
                            placeholder='{"days_overdue": 7, "check_time": "09:00"}'
                            rows={4}
                            defaultValue={typeof initialData?.trigger_config === 'object' 
                                ? JSON.stringify(initialData.trigger_config, null, 2) 
                                : '{}'}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            JSON-Objekt mit Trigger-spezifischen Parametern
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="action_config">Aktions-Konfiguration (JSON)</Label>
                        <Textarea
                            id="action_config"
                            {...register('action_config')}
                            placeholder='{"task_title": "Mahnung versenden", "priority": "high"}'
                            rows={4}
                            defaultValue={typeof initialData?.action_config === 'object' 
                                ? JSON.stringify(initialData.action_config, null, 2) 
                                : '{}'}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            JSON-Objekt mit Aktions-spezifischen Parametern
                        </p>
                    </div>

                    <div className="flex items-center justify-between py-2 border-t">
                        <div className="space-y-1">
                            <Label htmlFor="is_active">Automatisierung aktiv</Label>
                            <p className="text-xs text-slate-500">
                                Nur aktive Automatisierungen werden ausgeführt
                            </p>
                        </div>
                        <Switch
                            id="is_active"
                            checked={isActive}
                            onCheckedChange={(checked) => setValue('is_active', checked)}
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