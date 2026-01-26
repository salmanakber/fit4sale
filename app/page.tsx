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

      if (!response.ok) throw new Error('Senden fehlgeschlagen');

      const data = await response.json();
<<<<<<< HEAD
      alert('Danke! Ihre Angaben wurden übermittelt. Sie erhalten die vorläufige Auswertung per E-Mail.');
=======
      alert('Danke! Ihre Umfrage wurde eingereicht. Sie erhalten die vorläufige Auswertung per E-Mail.');
>>>>>>> 50dc961 (Final updates 24-jan)
      router.push('/');
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Senden fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <StepByStepQuiz onSubmit={handleQuizSubmit} />
    </main>
  );
}
