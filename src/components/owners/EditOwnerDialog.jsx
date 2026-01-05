import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SimpleOwnerForm from './SimpleOwnerForm';

export default function EditOwnerDialog({ owner, open, onOpenChange, onSuccess }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Eigentümer bearbeiten</DialogTitle>
                </DialogHeader>
                {owner && (
                    <SimpleOwnerForm
                        initialOwner={owner}
                        onSuccess={onSuccess}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}