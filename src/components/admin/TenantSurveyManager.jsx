import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Plus, Trash2 } from 'lucide-react';

export default function TenantSurveyManager({ companyId }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [surveyType, setSurveyType] = useState('satisfaction');
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [questionType, setQuestionType] = useState('rating');
  const queryClient = useQueryClient();

  const { data: surveys = [] } = useQuery({
    queryKey: ['surveys', companyId],
    queryFn: () => base44.entities.TenantSurvey.filter({ company_id: companyId, is_active: true })
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.entities.TenantSurvey.create({
        company_id: companyId,
        title,
        description,
        survey_type: surveyType,
        questions: questions.map((q, i) => ({
          question_id: `q${i + 1}`,
          question_text: q.text,
          question_type: q.type,
          options: q.options || []
        })),
        target_audience: 'all_tenants',
        is_active: true
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      setTitle('');
      setDescription('');
      setQuestions([]);
    }
  });

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setQuestions([...questions, { text: newQuestion, type: questionType, options: [] }]);
      setNewQuestion('');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Neue Umfrage erstellen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Umfrage-Titel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Beschreibung"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <Select value={surveyType} onValueChange={setSurveyType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="satisfaction">Zufriedenheit</SelectItem>
              <SelectItem value="feedback">Feedback</SelectItem>
              <SelectItem value="improvement">Verbesserungsvorschläge</SelectItem>
              <SelectItem value="event_planning">Event-Planung</SelectItem>
            </SelectContent>
          </Select>

          <div className="border rounded p-4 space-y-3">
            <p className="font-medium text-sm">Fragen</p>
            {questions.map((q, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-sm">{q.text}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Neue Frage"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="flex-1"
              />
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Bewertung</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="yes_no">Ja/Nein</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={addQuestion}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={() => createMutation.mutate()}
            disabled={!title || questions.length === 0 || createMutation.isPending}
            className="w-full"
          >
            Umfrage veröffentlichen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktive Umfragen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {surveys.map(survey => (
            <div key={survey.id} className="p-3 border rounded">
              <h4 className="font-medium mb-1">{survey.title}</h4>
              <p className="text-xs text-slate-600 mb-2">{survey.description}</p>
              <div className="flex items-center justify-between">
                <Badge>{survey.questions?.length || 0} Fragen</Badge>
                <Button size="sm" variant="outline">
                  Ergebnisse ansehen
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}