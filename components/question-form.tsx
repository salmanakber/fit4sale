'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CircleDot, 
  CheckSquare, 
  Type, 
  Trash2, 
  Plus, 
  GripVertical, 
  Save, 
  Loader2,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
      alert('Bitte geben Sie einen Fragetext ein.');
      return;
    }

    if (questionType !== 'textarea' && options.some((opt) => !opt.option_text.trim())) {
      alert('Bitte füllen Sie alle Antwortoptionen aus.');
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

  // Helper component for Type Cards
  const TypeCard = ({ type, label, icon: Icon, description }: any) => {
    const isSelected = questionType === type;
    return (
      <div
        onClick={() => setQuestionType(type)}
        className={cn(
          "cursor-pointer rounded-xl border p-4 transition-all duration-200 hover:shadow-md",
          isSelected
            ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
        )}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(
            "p-2 rounded-lg",
            isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <span className={cn("font-bold text-sm", isSelected ? "text-blue-900" : "text-slate-700")}>
            {label}
          </span>
        </div>
        <p className="text-xs text-slate-500 pl-[3.25rem]">
          {description}
        </p>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* SECTION 1: Question Text */}
      <div className="space-y-3">
        <Label htmlFor="question" className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Fragetext
        </Label>
        <div className="relative">
            <Textarea
                id="question"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="z.B. Wie oft treiben Sie Sport pro Woche?"
                rows={3}
                className="resize-none text-lg p-4 border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-colors"
            />
            <div className="absolute right-3 bottom-3 text-xs text-slate-400">
                {questionText.length} Zeichen
            </div>
        </div>
      </div>

      {/* SECTION 2: Question Type */}
      <div className="space-y-3">
        <Label className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Fragetyp
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TypeCard 
            type="radio" 
            label="Single Choice" 
            icon={CircleDot} 
            description="Der Nutzer wählt genau eine Option aus."
          />
          <TypeCard 
            type="checkbox" 
            label="Multiple Choice" 
            icon={CheckSquare} 
            description="Der Nutzer kann mehrere Optionen wählen."
          />
          <TypeCard 
            type="textarea" 
            label="Textantwort" 
            icon={Type} 
            description="Freitextfeld für offene Antworten."
          />
        </div>
      </div>

      {/* SECTION 3: Options Editor */}
      {questionType !== 'textarea' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
             <Label className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Antwortoptionen
             </Label>
             <span className="text-xs text-slate-400 italic">
                {options.length} Optionen definiert
             </span>
          </div>
          
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
             
             {/* Header Row */}
             <div className="grid grid-cols-12 gap-4 border-b border-slate-200 bg-slate-100/50 px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-6 md:col-span-7">Anzeigetext (Label)</div>
                <div className="col-span-4 md:col-span-3 flex items-center gap-1">
                    Technischer Wert
                    <div className="group relative">
                        <HelpCircle className="h-3 w-3 cursor-help text-slate-400" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded bg-slate-800 p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Dieser Wert wird für das Scoring/Benchmark benutzt.
                        </div>
                    </div>
                </div>
                <div className="col-span-1"></div>
             </div>

             {/* Rows */}
             <div className="divide-y divide-slate-200">
                {options.map((option, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-4 p-3 items-center group bg-white hover:bg-blue-50/30 transition-colors">
                        {/* Drag Handle / Index */}
                        <div className="col-span-1 flex justify-center text-slate-300 group-hover:text-blue-400 cursor-grab active:cursor-grabbing">
                            <span className="font-mono text-sm font-medium">{idx + 1}</span>
                            {/* <GripVertical className="h-4 w-4" /> (If DND implemented) */}
                        </div>

                        {/* Text Input */}
                        <div className="col-span-6 md:col-span-7">
                            <Input
                                placeholder={`Option ${idx + 1}`}
                                value={option.option_text}
                                onChange={(e) => handleOptionChange(idx, 'option_text', e.target.value)}
                                className="border-transparent bg-transparent hover:bg-white focus:bg-white focus:border-blue-500 px-2 h-9"
                            />
                        </div>

                        {/* Value Input */}
                        <div className="col-span-4 md:col-span-3">
                            <Input
                                placeholder="Auto"
                                value={option.value}
                                onChange={(e) => handleOptionChange(idx, 'value', e.target.value)}
                                className="border-transparent bg-transparent font-mono text-xs text-slate-600 hover:bg-white focus:bg-white focus:border-blue-500 px-2 h-9"
                            />
                        </div>

                        {/* Delete Action */}
                        <div className="col-span-1 flex justify-end">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveOption(idx)}
                                disabled={options.length <= 1}
                                className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
             </div>
             
             {/* Footer Add Button */}
             <div className="p-2 bg-slate-50 border-t border-slate-200">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleAddOption}
                    className="w-full border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
                >
                    <Plus className="mr-2 h-4 w-4" /> Weitere Option hinzufügen
                </Button>
             </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
        <Button 
            type="submit" 
            disabled={isLoading} 
            className="flex-1 bg-blue-900 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20 h-12 text-base font-medium"
        >
            {isLoading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Speichere...</>
            ) : (
                <><Save className="mr-2 h-5 w-5" /> {submitButtonText}</>
            )}
        </Button>
      </div>

    </form>
  );
}
