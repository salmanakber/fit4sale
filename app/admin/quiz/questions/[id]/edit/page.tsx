'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QuestionForm } from '@/components/question-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

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
    return <p className="text-foreground/60">Loading question...</p>;
  }

  if (!question) {
    return <p className="text-foreground/60">Question not found</p>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Question</h1>
          <p className="text-foreground/60 mt-2">
            Modify question text and answer options
          </p>
        </div>
        <Link href="/admin/quiz">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <QuestionForm
        initialQuestion={question}
        onSubmit={handleSubmit}
        isLoading={isSaving}
        submitButtonText="Save Changes"
      />
    </div>
  );
}

export default function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-foreground/60">Loading...</p>}>
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
