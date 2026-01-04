import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from 'lucide-react';
import LocationTreeSelect from './LocationTreeSelect';

const DEFAULT_METER_TYPES = [
    'Strom',
    'Kalt-Wasser',
    'Warm-Wasser',
    'Gas',
    'Heizung',
    'Öl'
];

export default function MeterForm({ open, onOpenChange, onSubmit, initialData, isLoading, building }) {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: initialData || { building_id: building?.id }
    });

    const [meterTypes, setMeterTypes] = React.useState(DEFAULT_METER_TYPES);
    const [showCustomType, setShowCustomType] = React.useState(false);
    const [customTypeName, setCustomTypeName] = React.useState('');
    const [location, setLocation] = React.useState({ type: null, index: null });

    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
            setLocation({
                type: initialData.location_type || null,
                index: initialData.location_type === 'gebaeude' ? initialData.gebaeude_index : 
                       initialData.location_type === 'unit' ? initialData.unit_index : null
            });
            if (initialData.meter_type && !DEFAULT_METER_TYPES.includes(initialData.meter_type)) {
                if (!meterTypes.includes(initialData.meter_type)) {
                    setMeterTypes([...DEFAULT_METER_TYPES, initialData.meter_type]);
                }
            }
        } else {
            reset({ building_id: building?.id });
            setLocation({ type: null, index: null });
        }
    }, [initialData, reset, building, open]);

    const handleAddCustomType = () => {
        if (customTypeName.trim() && !meterTypes.includes(customTypeName.trim())) {
            const newTypes = [...meterTypes, customTypeName.trim()];
            setMeterTypes(newTypes);
            setValue('meter_type', customTypeName.trim());
            setCustomTypeName('');
            setShowCustomType(false);
        }
    };

    const handleFormSubmit = (data) => {
        const submitData = {
            ...data,
            location_type: location.type,
            gebaeude_index: location.type === 'gebaeude' ? location.index : null,
            unit_index: location.type === 'unit' ? location.index : null,
        };
        onSubmit(submitData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Zähler bearbeiten' : 'Zähler anlegen'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="meter_type">Art *</Label>
                        {showCustomType ? (
                            <div className="flex gap-2">
                                <Input 
                                    value={customTypeName}
                                    onChange={(e) => setCustomTypeName(e.target.value)}
                                    placeholder="Neue Art eingeben..."
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomType())}
                                />
                                <Button 
                                    type="button"
                                    onClick={handleAddCustomType}
                                    disabled={!customTypeName.trim()}
                                >
                                    OK
                                </Button>
                                <Button 
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowCustomType(false);
                                        setCustomTypeName('');
                                    }}
                                >
                                    Abbrechen
                                </Button>
                            </div>
                        ) : (
                            <Select 
                                value={watch('meter_type')} 
                                onValueChange={(value) => {
                                    if (value === '__custom__') {
                                        setShowCustomType(true);
                                    } else {
                                        setValue('meter_type', value);
                                    }
                                }}
                            >
                                <SelectTrigger className={errors.meter_type ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Art wählen" />
                                </SelectTrigger>
                                <SelectContent>
                                    {meterTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="__custom__" className="text-emerald-600 font-medium">
                                        + Neue Art hinzufügen
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <LocationTreeSelect 
                        building={building}
                        value={location}
                        onChange={setLocation}
                    />

                    <div>
                        <Label htmlFor="meter_number">Nummer *</Label>
                        <Input 
                            id="meter_number"
                            {...register('meter_number', { required: true })}
                            placeholder="z.B. 12345678"
                            className={errors.meter_number ? 'border-red-500' : ''}
                        />
                    </div>

                    <div>
                        <Label htmlFor="location_description">Zusätzliche Ortsbeschreibung</Label>
                        <Textarea 
                            id="location_description"
                            {...register('location_description')}
                            placeholder="z.B. Im Keller links, neben der Heizung"
                            rows={2}
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
                            {initialData ? 'Speichern' : 'Anlegen'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}