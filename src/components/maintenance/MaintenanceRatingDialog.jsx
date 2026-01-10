import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function MaintenanceRatingDialog({ task, open, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const submitRating = useMutation({
    mutationFn: async () => {
      if (!task.assigned_to) {
        throw new Error('Kein Techniker zugewiesen');
      }

      // Find vendor by email
      const vendors = await base44.entities.Vendor.list();
      const vendor = vendors.find(v => v.email === task.assigned_to);
      
      if (!vendor) {
        throw new Error('Techniker nicht gefunden');
      }

      // Create rating
      await base44.entities.VendorRating.create({
        vendor_id: vendor.id,
        task_id: task.id,
        rated_by: (await base44.auth.me()).email,
        rating,
        comment,
        would_recommend: rating >= 4
      });

      // Update vendor average rating
      const allRatings = await base44.entities.VendorRating.filter({ vendor_id: vendor.id });
      const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
      
      await base44.entities.Vendor.update(vendor.id, {
        rating: avgRating,
        total_jobs: (vendor.total_jobs || 0) + 1
      });
    },
    onSuccess: () => {
      toast.success('Bewertung gespeichert!');
      queryClient.invalidateQueries(['maintenance-tasks']);
      setRating(0);
      setComment('');
      onClose();
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    }
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Bitte wählen Sie eine Bewertung');
      return;
    }
    submitRating.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Wartung bewerten</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <p className="text-sm font-semibold mb-2">Wie zufrieden waren Sie mit der Wartung?</p>
            <p className="text-xs text-slate-600 mb-4">{task?.title}</p>
            
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {rating > 0 && (
              <p className="text-center text-sm mt-2 text-slate-600">
                {rating === 5 && 'Ausgezeichnet!'}
                {rating === 4 && 'Sehr gut'}
                {rating === 3 && 'Gut'}
                {rating === 2 && 'Befriedigend'}
                {rating === 1 && 'Verbesserungsbedarf'}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">
              Kommentar (optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Teilen Sie uns Ihre Erfahrung mit..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitRating.isPending || rating === 0}
            >
              {submitRating.isPending ? 'Wird gespeichert...' : 'Bewertung absenden'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}