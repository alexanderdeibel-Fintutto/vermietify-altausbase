import { base44 } from '@/api/base44Client';

export function useActivityLogger() {
    const logActivity = async (action, entity_type, entity_id = null, old_values = null, new_values = null) => {
        try {
            await base44.functions.invoke('logActivity', {
                action,
                entity_type,
                entity_id,
                old_values,
                new_values
            });
        } catch (error) {
            console.error('Activity logging failed:', error);
            // Fehler nicht werfen, um Hauptfunktion nicht zu blockieren
        }
    };

    return { logActivity };
}