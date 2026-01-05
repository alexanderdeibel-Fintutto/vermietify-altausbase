import React from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from 'lucide-react';

export default function TaskForm({ open, onOpenChange, onSubmit, initialData, priorities, isLoading }) {
    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: initialData || {
            status: 'offen'
        }
    });

    React.useEffect(() => {
        if (open) {
            reset(initialData || { status: 'offen' });
        }
    }, [open, initialData, reset]);

    const handleFormSubmit = (data) => {
        onSubmit({
            ...data,
            due_date: data.due_date || null,
            completed_at: data.status === 'erledigt' && !initialData?.completed_at ? new Date().toISOString() : initialData?.completed_at
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Task bearbeiten' : 'Neuer Task'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="title">Titel *</Label>
                        <Input
                            id="title"
                            {...register('title', { required: true })}
                            placeholder="Task-Titel"
                            className={errors.title ? 'border-red-500' : ''}
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Beschreibung</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Detaillierte Beschreibung..."
                            rows={4}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                {...register('status')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="offen">Offen</option>
                                <option value="in_bearbeitung">In Bearbeitung</option>
                                <option value="wartend">Wartend</option>
                                <option value="erledigt">Erledigt</option>
                                <option value="abgebrochen">Abgebrochen</option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="priority_id">Priorität</Label>
                            <select
                                id="priority_id"
                                {...register('priority_id')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Keine</option>
                                {priorities.map(priority => (
                                    <option key={priority.id} value={priority.id}>
                                        {priority.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="due_date">Fälligkeitsdatum</Label>
                            <Input
                                id="due_date"
                                type="datetime-local"
                                {...register('due_date')}
                            />
                        </div>

                        <div>
                            <Label htmlFor="next_action">Nächste Aktion</Label>
                            <Input
                                id="next_action"
                                {...register('next_action')}
                                placeholder="z.B. Dokument erstellen"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="assigned_object_id">Zugeordnetes Objekt</Label>
                            <select
                                id="assigned_object_id"
                                {...register('assigned_object_id')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Kein Objekt</option>
                                {buildings.map(building => (
                                    <option key={building.id} value={building.id}>
                                        {building.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="assigned_tenant_id">Zugeordneter Mieter</Label>
                            <select
                                id="assigned_tenant_id"
                                {...register('assigned_tenant_id')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Kein Mieter</option>
                                {tenants.map(tenant => (
                                    <option key={tenant.id} value={tenant.id}>
                                        {tenant.first_name} {tenant.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
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