'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionForm } from '@/components/question-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Pencil, 
  Loader2, 
  AlertCircle, 
  Lightbulb,
  CheckSquare,
  CircleDot
} from 'lucide-react';
import { cn } from '@/lib/utils';

function EditQuestionContent({ id }: { id: string }) {
  const router = useRouter();
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await fetch(`/api/admin/quiz/questions/${id}`);
        if (!response.ok) throw new Error('Failed to fetch question');
        const data = await response.json();
        setQuestion(data);
      } catch (error) {
        console.error('Error fetching question:', error);
        // Ideally use a toast notification here
        alert('Failed to load question');
        router.push('/admin/quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id, router]);

  const handleSubmit = async (data: {
    question_text: string;
    question_type: 'radio' | 'checkbox';
    options: any[];
  }) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/quiz/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update question');

      alert('Question updated successfully!');
      router.push('/admin/quiz');
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Failed to update question');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
        <p>Frage wird geladen...</p>
      </div>
    );
  }

  if (!question) {
    return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />
            <p className="font-semibold">Frage konnte nicht gefunden werden.</p>
            <Link href="/admin/quiz" className="mt-4 inline-block text-sm underline hover:text-red-950">
                Zurück zur Übersicht
            </Link>
        </div>
    );
  }

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
                <Pencil className="h-5 w-5" />
              </span>
              Frage bearbeiten
            </h1>
            <p className="mt-2 text-slate-500 text-lg">
              Passen Sie den Fragetext und die Antwortoptionen an.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
             <QuestionForm
                initialQuestion={question}
                onSubmit={handleSubmit}
                isLoading={isSaving}
                submitButtonText="Änderungen Speichern"
            />
          </div>
        </div>

        {/* Sidebar / Context */}
        <div className="space-y-6">
          
           {/* Current Status Card */}
           <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Aktueller Typ
            </h3>
            <div className="flex items-center gap-3">
                <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    question.question_type === 'radio' ? "bg-sky-100 text-sky-600" : "bg-indigo-100 text-indigo-600"
                )}>
                    {question.question_type === 'radio' ? <CircleDot className="h-5 w-5" /> : <CheckSquare className="h-5 w-5" />}
                </div>
                <div>
                    <p className="font-semibold text-slate-800">
                        {question.question_type === 'radio' ? 'Single Choice' : 'Multiple Choice'}
                    </p>
                    <p className="text-xs text-slate-500">
                        {question.question_type === 'radio' ? 'Nur eine Antwort möglich' : 'Mehrfachauswahl möglich'}
                    </p>
                </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-6">
            <h3 className="mb-3 flex items-center text-xs font-bold uppercase tracking-wide text-blue-800">
              <Lightbulb className="mr-2 h-4 w-4" />
              Hinweis
            </h3>
            <p className="text-sm text-blue-900/70 leading-relaxed">
              Änderungen an Fragen wirken sich sofort auf das Live-Quiz aus. 
              Bereits abgeschlossene Eingaben werden durch diese Änderung <strong>nicht</strong> verändert.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// Loading Fallback Component
function LoadingState() {
    return (
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
            <p>Editor wird geladen...</p>
        </div>
    )
}

export default function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<LoadingState />}>
      <EditQuestionPageContent params={params} />
    </Suspense>
  );
}

async function EditQuestionPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditQuestionContent id={id} />;
}