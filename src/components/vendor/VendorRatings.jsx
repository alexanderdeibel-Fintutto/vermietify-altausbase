import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function VendorRatings({ vendorId }) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState({ rating: 5, comment: '' });
  const queryClient = useQueryClient();

  const { data: ratings = [] } = useQuery({
    queryKey: ['vendorRatings', vendorId],
    queryFn: () => base44.entities.VendorRating.filter({ vendor_id: vendorId }, '-created_date', 100),
    enabled: !!vendorId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      await base44.entities.VendorRating.create({
        vendor_id: vendorId,
        rated_by: user.email,
        ...data
      });
      
      // Update vendor average rating
      const avgRating = [...ratings, data].reduce((sum, r) => sum + r.rating, 0) / (ratings.length + 1);
      await base44.entities.Vendor.update(vendorId, { rating: avgRating });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorRatings'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Bewertung gespeichert');
      setShowForm(false);
      setRating({ rating: 5, comment: '' });
    }
  });

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(!showForm)} size="sm">
        <Plus className="w-4 h-4 mr-2" />
        Bewertung abgeben
      </Button>

      {showForm && (
        <div className="p-4 border rounded space-y-3">
          <div>
            <Label>Bewertung</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <Star
                  key={n}
                  className={`w-6 h-6 cursor-pointer ${n <= rating.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                  onClick={() => setRating({ ...rating, rating: n })}
                />
              ))}
            </div>
          </div>
          <div>
            <Label>Kommentar</Label>
            <Textarea value={rating.comment} onChange={(e) => setRating({ ...rating, comment: e.target.value })} rows={3} />
          </div>
          <Button onClick={() => createMutation.mutate(rating)}>Speichern</Button>
        </div>
      )}

      <div className="space-y-2">
        {ratings.map(r => (
          <div key={r.id} className="p-3 border rounded">
            <div className="flex items-center gap-2 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
              ))}
            </div>
            {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
            <p className="text-xs text-slate-500 mt-1">{r.rated_by} - {new Date(r.created_date).toLocaleDateString('de-DE')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}