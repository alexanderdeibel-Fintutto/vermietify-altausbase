import React, { useEffect } from 'react';
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

export default function RecipientForm({ open, onOpenChange, recipient, onSuccess, isLoading }) {
    const { register, handleSubmit, reset } = useForm({
        defaultValues: recipient || { name: '', notes: '' }
    });

    useEffect(() => {
        if (recipient) {
            reset(recipient);
        } else {
            reset({ name: '', notes: '' });
        }
    }, [recipient, reset]);

    const onSubmit = (data) => {
        onSuccess(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {recipient ? 'Empfänger bearbeiten' : 'Neuer Empfänger'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="name">Empfänger/Aussteller *</Label>
                        <Input 
                            id="name"
                            {...register('name', { required: true })}
                            placeholder="z.B. Stadtwerke, Versicherung AG..."
                        />
                    </div>

                    <div>
                        <Label htmlFor="notes">Notizen</Label>
                        <Textarea 
                            id="notes"
                            {...register('notes')}
                            placeholder="Optionale Notizen..."
                            className="h-24"
                        />
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
                            {recipient ? 'Speichern' : 'Hinzufügen'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}