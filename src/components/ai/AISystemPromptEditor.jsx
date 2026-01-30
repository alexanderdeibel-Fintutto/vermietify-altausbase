import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';

const FEATURES = [
    { value: 'chat', label: 'AI Chat' },
    { value: 'ocr', label: 'Document OCR' },
    { value: 'analysis', label: 'Datenanalyse' },
    { value: 'categorization', label: 'Automatische Kategorisierung' },
    { value: 'document_gen', label: 'Dokumentengenerierung' },
    { value: 'recommendation', label: 'Empfehlungen' },
    { value: 'other', label: 'Sonstiges' }
];

export default function AISystemPromptEditor({ prompt, onSave, onCancel }) {
    const [formData, setFormData] = useState(
        prompt || {
            feature_key: 'chat',
            custom_name: '',
            system_prompt: '',
            is_active: true
        }
    );

    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.custom_name.trim() || !formData.system_prompt.trim()) {
            alert('Name und System Prompt sind erforderlich');
            return;
        }
        setIsSaving(true);
        try {
            await onSave(formData);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{prompt ? 'Prompt bearbeiten' : 'Neuer Prompt'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Feature Selection */}
                    <div>
                        <Label htmlFor="feature">Feature</Label>
                        <Select value={formData.feature_key} onValueChange={(value) => handleChange('feature_key', value)}>
                            <SelectTrigger id="feature">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FEATURES.map(f => (
                                    <SelectItem key={f.value} value={f.value}>
                                        {f.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Name */}
                    <div>
                        <Label htmlFor="name">Prompt Name</Label>
                        <input
                            id="name"
                            type="text"
                            value={formData.custom_name}
                            onChange={(e) => handleChange('custom_name', e.target.value)}
                            placeholder="z.B. 'Deutsche Kundenservice Bot'"
                            className="vf-input"
                        />
                    </div>

                    {/* System Prompt */}
                    <div>
                        <Label htmlFor="prompt">System Prompt</Label>
                        <textarea
                            id="prompt"
                            value={formData.system_prompt}
                            onChange={(e) => handleChange('system_prompt', e.target.value)}
                            placeholder="Schreibe den System Prompt hier. z.B.: Du bist ein hilfreicher Kundenservice-Agent..."
                            className="vf-textarea h-48 font-mono text-sm"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            {formData.system_prompt.length} Zeichen
                        </p>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-3">
                        <input
                            id="active"
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => handleChange('is_active', e.target.checked)}
                            className="vf-checkbox"
                        />
                        <Label htmlFor="active" className="cursor-pointer">
                            Aktiv
                        </Label>
                    </div>

                    {/* Info */}
                    {prompt && (
                        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded">
                            <div>Erstellt: {new Date(prompt.created_date).toLocaleDateString('de-DE')}</div>
                            {prompt.last_modified_by && (
                                <div>Bearbeitet: {prompt.last_modified_by}</div>
                            )}
                            <div>Nutzungen: {prompt.usage_count || 0}</div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 vf-btn-gradient"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Speichern...' : 'Speichern'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Abbrechen
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}