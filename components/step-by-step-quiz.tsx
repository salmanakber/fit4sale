'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface QuizOption {
  id: string;
  option_text: string;
  value: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: 'radio' | 'checkbox' | 'textarea';
  order_index: number;
  quiz_answer_options: QuizOption[];
}

interface IntroSettings {
  title: string;
  description: string;
  time_estimate: string;
  additional_text: string;
}

interface QuizData {
  intro: IntroSettings;
  questions: Question[];
}

interface Answers {
  [questionId: string]: string | string[];
}

export function StepByStepQuiz({ onSubmit }: { onSubmit: (answers: any) => void }) {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'intro' | 'email' | number>('intro');
  const [answers, setAnswers] = useState<Answers>({});
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch('/api/quiz');
        if (!response.ok) throw new Error('Failed to fetch quiz');
        const data = await response.json();
        setQuizData(data);
      } catch (error) {
        console.error('Error fetching quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, []);

  const handleAnswerChange = (
    questionId: string,
    value: string,
    isMultiple: boolean
  ) => {
    if (isMultiple) {
      const currentAnswers = (answers[questionId] as string[]) || [];
      if (currentAnswers.includes(value)) {
        setAnswers({
          ...answers,
          [questionId]: currentAnswers.filter((a) => a !== value),
        });
      } else {
        setAnswers({
          ...answers,
          [questionId]: [...currentAnswers, value],
        });
      }
    } else {
      setAnswers({
        ...answers,
        [questionId]: value,
      });
    }
  };

  const validateEmail = (e: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(e);
  };

  const handleNext = () => {
    if (currentStep === 'intro') {
      setCurrentStep('email');
    } else if (currentStep === 'email') {
      if (!email.trim()) {
        setEmailError('Bitte geben Sie eine E-Mail-Adresse ein');
        return;
      }
      if (!validateEmail(email)) {
        setEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
        return;
      }
      setEmailError('');
      setCurrentStep(0);
    } else if (typeof currentStep === 'number') {
      const nextStep = currentStep + 1;
      if (quizData && nextStep < quizData.questions.length) {
        setCurrentStep(nextStep);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep === 'email') {
      setCurrentStep('intro');
    } else if (typeof currentStep === 'number') {
      const prevStep = currentStep - 1;
      if (prevStep >= 0) {
        setCurrentStep(prevStep);
      } else {
        setCurrentStep('email');
      }
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        participant_email: email,
        answers: answers,
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !quizData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-foreground">Bewertung wird geladen...</p>
      </div>
    );
  }

  const totalSteps = quizData.questions.length;
  const isIntro = currentStep === 'intro';
  const isEmailStep = currentStep === 'email';
  const questionIndex = typeof currentStep === 'number' ? currentStep : -1;
  const currentQuestion = typeof currentStep === 'number' ? quizData.questions[currentStep] : null;
  const isLastQuestion = typeof currentStep === 'number' && currentStep === totalSteps - 1;
  const progressPercent = isIntro || isEmailStep ? 0 : ((questionIndex + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        {!isIntro && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                Frage {questionIndex + 1} von {totalSteps}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <Card className="p-8 md:p-12">
          {isIntro ? (
            // Intro Screen
            <div className="space-y-6 text-center">
              <div className="flex justify-center mb-6">
                <Image
                  src="/fit4sale-logo.png"
                  alt="Fit4Sale Logo"
                  width={200}
                  height={200}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {quizData.intro.title}
                </h1>
                <p className="text-lg text-foreground/80 mb-6">
                  {quizData.intro.description}
                </p>
              </div>

              <div className="bg-secondary/30 rounded-lg p-6">
                <p className="text-sm text-foreground/70 mb-2">Geschätzte Zeit</p>
                <p className="text-2xl font-semibold text-primary">
                  {quizData.intro.estimated_time}
                </p>
              </div>

              <Button
                onClick={handleNext}
                size="lg"
                className="mt-8 w-full md:w-auto"
              >
                Bewertung starten
              </Button>
            </div>
          ) : isEmailStep ? (
            // Email Screen
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Ihre E-Mail-Adresse
                </h2>
                <p className="text-foreground/70 mb-6">
                  Bitte geben Sie Ihre E-Mail-Adresse ein, um Ihre Bewertungsergebnisse zu erhalten.
                </p>
              </div>

              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  placeholder="ihre.email@beispiel.de"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {emailError && (
                  <p className="text-destructive text-sm mt-2">{emailError}</p>
                )}
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex-1 bg-transparent"
                >
                  Zurück
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Weiter
                </Button>
              </div>
            </div>
          ) : currentQuestion ? (
            // Question Screen
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  {currentQuestion.question_text}
                </h2>
              </div>

              <div className="space-y-4">
                {currentQuestion.question_type === 'textarea' ? (
                  <textarea
                    value={typeof answers[currentQuestion.id] === 'string' ? answers[currentQuestion.id] : ''}
                    onChange={(e) => {
                      setAnswers({
                        ...answers,
                        [currentQuestion.id]: e.target.value,
                      });
                    }}
                    placeholder="Geben Sie hier Ihre Antwort ein..."
                    rows={6}
                    className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  currentQuestion.quiz_answer_options.map((option) => (
                    <div key={option.id} className="flex items-center">
                      {currentQuestion.question_type === 'radio' ? (
                        <>
                          <input
                            type="radio"
                            id={option.id}
                            name={currentQuestion.id}
                            value={option.value}
                            checked={
                              answers[currentQuestion.id] === option.value
                            }
                            onChange={() =>
                              handleAnswerChange(
                                currentQuestion.id,
                                option.value,
                                false
                              )
                            }
                            className="w-4 h-4 text-primary cursor-pointer"
                          />
                        </>
                      ) : (
                        <>
                          <input
                            type="checkbox"
                            id={option.id}
                            value={option.value}
                            checked={
                              Array.isArray(answers[currentQuestion.id])
                                ? (answers[currentQuestion.id] as string[]).includes(option.value)
                                : false
                            }
                            onChange={() =>
                              handleAnswerChange(
                                currentQuestion.id,
                                option.value,
                                true
                              )
                            }
                            className="w-4 h-4 text-primary cursor-pointer"
                          />
                        </>
                      )}
                      <label
                        htmlFor={option.id}
                        className="ml-3 text-foreground cursor-pointer flex-1 py-2"
                      >
                        {option.option_text}
                      </label>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex-1 bg-transparent"
                >
                  Zurück
                </Button>
                {isLastQuestion ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? 'Wird eingereicht...' : 'Bewertung abschließen'}
                  </Button>
                ) : (
                  <Button onClick={handleNext} className="flex-1">
                    Weiter
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
