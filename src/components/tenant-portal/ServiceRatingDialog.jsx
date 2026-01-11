import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function ServiceRatingDialog({ 
  maintenanceTask, 
  tenantId, 
  companyId,
  ratingType = 'vendor' 
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [serviceQuality, setServiceQuality] = useState(0);
  const [responseTime, setResponseTime] = useState(0);
  const [professionalism, setProfessionalism] = useState(0);
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const queryClient = useQueryClient();

  const submitRatingMutation = useMutation({
    mutationFn: () =>
      base44.entities.ServiceRating.create({
        tenant_id: tenantId,
        company_id: companyId,
        maintenance_task_id: maintenanceTask.id,
        rating_type: ratingType,
        vendor_id: maintenanceTask.assigned_vendor_id,
        rating,
        service_quality: serviceQuality,
        response_time: responseTime,
        professionalism: professionalism,
        comment,
        would_recommend: wouldRecommend
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-ratings'] });
      setOpen(false);
      setRating(0);
      setServiceQuality(0);
      setResponseTime(0);
      setProfessionalism(0);
      setComment('');
      setWouldRecommend(null);
    }
  });

  const StarRating = ({ value, onChange, label }) => (
    <div className="mb-4">
      <p className="text-sm mb-2">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-6 h-6 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full">
          <Star className="w-4 h-4 mr-2" />
          {ratingType === 'vendor' ? 'Handwerker bewerten' : 'Verwaltung bewerten'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {ratingType === 'vendor' ? 'Handwerker bewerten' : 'Verwaltung bewerten'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <StarRating
            value={rating}
            onChange={setRating}
            label="Gesamtbewertung"
          />
          <StarRating
            value={serviceQuality}
            onChange={setServiceQuality}
            label="Servicequalität"
          />
          <StarRating
            value={responseTime}
            onChange={setResponseTime}
            label="Reaktionszeit"
          />
          <StarRating
            value={professionalism}
            onChange={setProfessionalism}
            label="Professionalität"
          />

          <div>
            <p className="text-sm mb-2">Würden Sie diesen Service weiterempfehlen?</p>
            <div className="flex gap-2">
              <Button
                variant={wouldRecommend === true ? "default" : "outline"}
                onClick={() => setWouldRecommend(true)}
                className="flex-1"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Ja
              </Button>
              <Button
                variant={wouldRecommend === false ? "default" : "outline"}
                onClick={() => setWouldRecommend(false)}
                className="flex-1"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Nein
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm mb-2">Kommentar (optional)</p>
            <Textarea
              placeholder="Ihre Erfahrungen..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={() => submitRatingMutation.mutate()}
            disabled={!rating || submitRatingMutation.isPending}
            className="w-full"
          >
            Bewertung absenden
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}