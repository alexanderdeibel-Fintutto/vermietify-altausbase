import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Star, CheckCircle } from 'lucide-react';

export default function TenantSurveyParticipation({ tenantId }) {
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const queryClient = useQueryClient();

  const { data: surveys = [] } = useQuery({
    queryKey: ['active-surveys'],
    queryFn: () => base44.entities.TenantSurvey.filter({ is_active: true })
  });

  const { data: myResponses = [] } = useQuery({
    queryKey: ['my-survey-responses', tenantId],
    queryFn: () => base44.entities.SurveyResponse.filter({ tenant_id: tenantId })
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const answerArray = Object.keys(answers).map(qId => ({
        question_id: qId,
        answer: answers[qId]
      }));
      
      return base44.entities.SurveyResponse.create({
        survey_id: selectedSurvey.id,
        tenant_id: tenantId,
        answers: answerArray,
        submitted_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-survey-responses'] });
      setSelectedSurvey(null);
      setAnswers({});
    }
  });

  const availableSurveys = surveys.filter(s => 
    !myResponses.some(r => r.survey_id === s.id)
  );

  if (selectedSurvey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{selectedSurvey.title}</CardTitle>
          <p className="text-sm text-slate-600">{selectedSurvey.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedSurvey.questions?.map(q => (
            <div key={q.question_id} className="space-y-2">
              <p className="font-medium text-sm">{q.question_text}</p>
              
              {q.question_type === 'rating' && (
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setAnswers({ ...answers, [q.question_id]: rating.toString() })}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          parseInt(answers[q.question_id] || 0) >= rating 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}

              {q.question_type === 'text' && (
                <Textarea
                  placeholder="Ihre Antwort..."
                  value={answers[q.question_id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.question_id]: e.target.value })}
                  rows={3}
                />
              )}

              {q.question_type === 'yes_no' && (
                <div className="flex gap-2">
                  <Button
                    variant={answers[q.question_id] === 'yes' ? 'default' : 'outline'}
                    onClick={() => setAnswers({ ...answers, [q.question_id]: 'yes' })}
                    className="flex-1"
                  >
                    Ja
                  </Button>
                  <Button
                    variant={answers[q.question_id] === 'no' ? 'default' : 'outline'}
                    onClick={() => setAnswers({ ...answers, [q.question_id]: 'no' })}
                    className="flex-1"
                  >
                    Nein
                  </Button>
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={Object.keys(answers).length < selectedSurvey.questions?.length}
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Absenden
            </Button>
            <Button variant="outline" onClick={() => setSelectedSurvey(null)}>
              Abbrechen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Umfragen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableSurveys.length === 0 ? (
          <p className="text-center text-slate-600 py-8">Keine offenen Umfragen</p>
        ) : (
          availableSurveys.map(survey => (
            <div key={survey.id} className="p-3 border rounded hover:bg-slate-50 cursor-pointer"
              onClick={() => setSelectedSurvey(survey)}
            >
              <h4 className="font-medium mb-1">{survey.title}</h4>
              <p className="text-xs text-slate-600 mb-2">{survey.description}</p>
              <Badge>{survey.questions?.length || 0} Fragen</Badge>
            </div>
          ))
        )}

        {myResponses.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Bereits teilgenommen ({myResponses.length})</p>
            <div className="space-y-2">
              {myResponses.map(response => {
                const survey = surveys.find(s => s.id === response.survey_id);
                return (
                  <div key={response.id} className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 inline mr-2" />
                    {survey?.title || 'Umfrage'}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}