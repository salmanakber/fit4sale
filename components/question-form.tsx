'use client';

import React from "react"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Option {
  option_text: string;
  value: string;
}

interface QuestionFormProps {
  initialQuestion?: {
    question_text: string;
    question_type: 'radio' | 'checkbox' | 'textarea';
    quiz_answer_options: Option[];
  };
  onSubmit: (data: {
    question_text: string;
    question_type: 'radio' | 'checkbox' | 'textarea';
    options: Option[];
  }) => Promise<void>;
  isLoading?: boolean;
  submitButtonText?: string;
}

export function QuestionForm({
  initialQuestion,
  onSubmit,
  isLoading = false,
  submitButtonText = 'Create Question',
}: QuestionFormProps) {
  const [questionText, setQuestionText] = useState(
    initialQuestion?.question_text || ''
  );
  const [questionType, setQuestionType] = useState<'radio' | 'checkbox' | 'textarea'>(
    initialQuestion?.question_type || 'radio'
  );
  const [options, setOptions] = useState<Option[]>(
    initialQuestion?.quiz_answer_options || [
      { option_text: '', value: '' },
      { option_text: '', value: '' },
    ]
  );

  const handleOptionChange = (
    index: number,
    field: 'option_text' | 'value',
    value: string
  ) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      [field]: value,
    };
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    setOptions([...options, { option_text: '', value: '' }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionText.trim()) {
      alert('Please enter a question');
      return;
    }

    if (options.some((opt) => !opt.option_text.trim())) {
      alert('Please fill in all option texts');
      return;
    }

    try {
      await onSubmit({
        question_text: questionText,
        question_type: questionType,
        options: options.map((opt, idx) => ({
          option_text: opt.option_text,
          value: opt.value || `option_${idx}`,
        })),
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="question" className="text-base font-medium">
            Fragetext *
          </Label>
          <Textarea
            id="question"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Wie ist Ihre Fitnesserfahrung?"
            rows={3}
            className="mt-2 w-full"
          />
        </div>

        <div>
          <Label className="text-base font-medium mb-3 block">
            Fragetyp *
          </Label>
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="radio"
                checked={questionType === 'radio'}
                onChange={(e) => setQuestionType(e.target.value as 'radio' | 'checkbox' | 'textarea')}
                className="w-4 h-4 text-primary"
              />
              <span className="ml-2 text-foreground">
                Einfachauswahl (Optionsschaltflächen)
              </span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="checkbox"
                checked={questionType === 'checkbox'}
                onChange={(e) => setQuestionType(e.target.value as 'radio' | 'checkbox' | 'textarea')}
                className="w-4 h-4 text-primary"
              />
              <span className="ml-2 text-foreground">
                Mehrfachauswahl (Kontrollkästchen)
              </span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="textarea"
                checked={questionType === 'textarea'}
                onChange={(e) => setQuestionType(e.target.value as 'radio' | 'checkbox' | 'textarea')}
                className="w-4 h-4 text-primary"
              />
              <span className="ml-2 text-foreground">
                Textantwort (Textbereich)
              </span>
            </label>
          </div>
        </div>

        {questionType !== 'textarea' && (
        <div className="space-y-4">
          <Label className="text-base font-medium block">Antwortoptionen *</Label>
          {options.map((option, idx) => (
            <div key={idx} className="flex gap-3 items-start bg-muted/30 p-4 rounded-lg">
              <div className="flex-1 space-y-3">
                <Input
                  placeholder={`Option ${idx + 1} Text`}
                  value={option.option_text}
                  onChange={(e) =>
                    handleOptionChange(idx, 'option_text', e.target.value)
                  }
                  className="w-full"
                />
                <Input
                  placeholder={`Wert (automatisch generiert wenn leer)`}
                  value={option.value}
                  onChange={(e) => handleOptionChange(idx, 'value', e.target.value)}
                  className="w-full"
                  size="sm"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveOption(idx)}
                disabled={options.length <= 2}
                className="mt-0"
              >
                Entfernen
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={handleAddOption}
            className="w-full bg-transparent"
          >
            + Weitere Option hinzufügen
          </Button>
        </div>
        )}

        <div className="flex gap-3 pt-6 border-t">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Wird gespeichert...' : submitButtonText}
          </Button>
        </div>
      </form>
    </Card>
  );
}
