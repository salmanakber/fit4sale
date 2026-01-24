'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionForm } from '@/components/question-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, HelpCircle, Lightbulb } from 'lucide-react';

export default function CreateQuestionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: {
    question_text: string;
    question_type: 'radio' | 'checkbox';
    options: any[];
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/quiz/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create question');

      // In a real app, use a Toast notification here instead of alert
      alert('Question created successfully!');
      router.push('/admin/quiz');
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Failed to create question');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      
      {/* Header / Navigation */}
      <div className="flex flex-col gap-4">
        <Link 
          href="/admin/quiz" 
          className="group flex w-fit items-center text-sm font-medium text-slate-500 transition-colors hover:text-blue-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Zurück zur Übersicht
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-950 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <PlusCircle className="h-6 w-6" />
              </span>
              Neue Frage erstellen
            </h1>
            <p className="mt-2 text-slate-500 text-lg">
              Fügen Sie eine neue Frage zum Fit4Sale Bewertungsbogen hinzu.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
             <QuestionForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              submitButtonText="Frage Speichern"
            />
          </div>
        </div>

        {/* Sidebar / Context */}
        <div className="space-y-6">
          
          {/* Info Card */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-6">
            <h3 className="mb-3 flex items-center text-sm font-bold uppercase tracking-wide text-blue-800">
              <Lightbulb className="mr-2 h-4 w-4" />
              Tipps für gute Fragen
            </h3>
            <ul className="list-disc pl-4 space-y-2 text-sm text-blue-900/70">
              <li>Halten Sie die Frage kurz und präzise.</li>
              <li>Nutzen Sie <strong>Single Choice</strong> (Radio) für Ja/Nein Fragen.</li>
              <li>Nutzen Sie <strong>Multiple Choice</strong> (Checkbox), wenn mehrere Symptome zutreffen können.</li>
              <li>Achten Sie auf eindeutige Antwortoptionen.</li>
            </ul>
          </div>

          {/* Type Explanation */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 flex items-center text-sm font-bold uppercase tracking-wide text-slate-500">
              <HelpCircle className="mr-2 h-4 w-4" />
              Fragetypen
            </h3>
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-1 rounded">Single Choice</span>
                <p className="mt-1 text-xs text-slate-500">Der Nutzer kann nur eine einzige Option auswählen (z.B. Geschlecht, Ja/Nein).</p>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Multiple Choice</span>
                <p className="mt-1 text-xs text-slate-500">Der Nutzer kann mehrere Optionen gleichzeitig auswählen (z.B. Zutreffende Beschwerden).</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}