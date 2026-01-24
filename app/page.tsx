'use client';

import { StepByStepQuiz } from '@/components/step-by-step-quiz';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleQuizSubmit = async (answers: any) => {
    try {
      const response = await fetch('/api/submit-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });

      if (!response.ok) throw new Error('Failed to submit survey');

      const data = await response.json();
      alert('Survey submitted successfully! You will receive an evaluation shortly.');
      router.push('/');
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Failed to submit survey. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <StepByStepQuiz onSubmit={handleQuizSubmit} />
    </main>
  );
}
