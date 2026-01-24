'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionForm } from '@/components/question-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
    <div className="max-w-2xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create New Question</h1>
          <p className="text-foreground/60 mt-2">
            Add a new question to the Fit4Sale survey
          </p>
        </div>
        <Link href="/admin/quiz">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <QuestionForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitButtonText="Create Question"
      />
    </div>
  );
}
