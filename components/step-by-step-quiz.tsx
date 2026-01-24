'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Mail, 
  Loader2,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizOption {
  id: string;
  option_text: string;
  option_value: string;
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
  estimated_time: string;
  button_text?: string;
  additional_text?: string;
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
      // Optional: Auto-advance on single choice selection after a short delay
      // setTimeout(() => handleNext(), 300); 
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
      } else {
        // Prepare for submission if it's the last question handled here
        // Usually handled by the button logic below
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
        <p className="text-slate-500 font-medium tracking-wide">Wird geladen...</p>
      </div>
    );
  }

  const totalSteps = quizData.questions.length;
  const isIntro = currentStep === 'intro';
  const isEmailStep = currentStep === 'email';
  const questionIndex = typeof currentStep === 'number' ? currentStep : -1;
  const currentQuestion = typeof currentStep === 'number' ? quizData.questions[currentStep] : null;
  const isLastQuestion = typeof currentStep === 'number' && currentStep === totalSteps - 1;
  
  // Progress Calculation
  let progressPercent = 0;
  if (!isIntro) {
     if (isEmailStep) progressPercent = 5;
     else progressPercent = 5 + (((questionIndex + 1) / totalSteps) * 95);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      
      {/* Mobile Logo (Top) */}
      <div className="mb-6 md:hidden">
          <div className="relative h-10 w-32">
             <Image
                src="/fit4sale-logo.png"
                alt="Fit4Sale Logo"
                fill
                className="object-contain"
              />
          </div>
      </div>

      <div className="w-full max-w-3xl relative">
        
        {/* Progress Bar (Floating above card) */}
        {!isIntro && (
          <div className="mb-6 px-1">
            <div className="flex justify-between items-center mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>
                 {isEmailStep ? "Start" : `Frage ${questionIndex + 1} / ${totalSteps}`}
              </span>
              <span>
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-900 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <Card className="overflow-hidden rounded-2xl border-0 shadow-2xl shadow-blue-900/10 bg-white">
          <div className="p-8 md:p-12">
            
            {isIntro ? (
              // --- INTRO SCREEN ---
              <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="hidden md:block relative h-16 w-48 mb-4">
                  <Image
                    src="/fit4sale-logo.png"
                    alt="Fit4Sale Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                
                <div className="space-y-4 max-w-lg">
                  <h1 className="text-3xl md:text-5xl font-bold text-blue-950 tracking-tight">
                    {quizData.intro.title}
                  </h1>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    {quizData.intro.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-blue-50 px-5 py-2.5 text-blue-800 font-medium">
                  <Clock className="h-5 w-5" />
                  <span>{quizData.intro.estimated_time}</span>
                </div>

                <div className="pt-4 w-full max-w-xs">
                    <Button
                        onClick={handleNext}
                        size="lg"
                        className="w-full h-14 text-lg bg-blue-900 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20 rounded-xl transition-transform hover:scale-105"
                    >
                        {quizData.intro.button_text || "Jetzt Starten"}
                    </Button>
                </div>
              </div>

            ) : isEmailStep ? (
              // --- EMAIL SCREEN ---
              <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                <div className="text-center md:text-left space-y-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-blue-950">
                    Ihre E-Mail-Adresse
                  </h2>
                  <p className="text-slate-500 text-lg">
                    Wohin dürfen wir Ihre persönliche Auswertung senden?
                  </p>
                </div>

                <div className="relative group">
                  <Mail className="absolute left-4 top-4 h-6 w-6 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                    autoFocus
                    placeholder="name@beispiel.de"
                    className={cn(
                        "w-full pl-12 pr-4 py-4 text-lg bg-slate-50 border-2 rounded-xl focus:outline-none transition-all duration-200",
                        emailError 
                            ? "border-red-300 focus:border-red-500 bg-red-50/50 text-red-900 placeholder:text-red-300" 
                            : "border-slate-100 focus:border-blue-600 focus:bg-white text-slate-900"
                    )}
                  />
                  {emailError && (
                    <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-sm text-red-500 font-medium animate-in slide-in-from-top-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500"></span>
                        {emailError}
                    </div>
                  )}
                </div>

                <div className="pt-8 flex gap-4">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={handlePrevious}
                    className="flex-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 h-14"
                  >
                    Zurück
                  </Button>
                  <Button 
                    onClick={handleNext} 
                    size="lg" 
                    className="flex-[2] bg-blue-900 hover:bg-blue-800 text-white h-14 text-lg rounded-xl shadow-md"
                  >
                    Weiter <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>

            ) : currentQuestion ? (
              // --- QUESTION SCREEN ---
              <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500" key={currentQuestion.id}>
                
                {/* Question Header */}
                <div className="space-y-4">
                    <span className="inline-block text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wide">
                        {currentQuestion.question_type === 'radio' ? 'Eine Auswahl' : 'Mehrfachauswahl'}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-blue-950 leading-tight">
                    {currentQuestion.question_text}
                    </h2>
                </div>

                {/* Options Grid */}
                <div className="space-y-3">
                  {currentQuestion.question_type === 'textarea' ? (
                    <div className="relative">
                        <textarea
                            value={typeof answers[currentQuestion.id] === 'string' ? answers[currentQuestion.id] : ''}
                            onChange={(e) => {
                            setAnswers({
                                ...answers,
                                [currentQuestion.id]: e.target.value,
                            });
                            }}
                            autoFocus
                            placeholder="Schreiben Sie hier Ihre Antwort..."
                            rows={6}
                            className="w-full p-4 text-lg bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all resize-none text-slate-900"
                        />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {currentQuestion.quiz_answer_options.map((option) => {
                             const isSelected = Array.isArray(answers[currentQuestion.id])
                             ? (answers[currentQuestion.id] as string[]).includes(option.option_value)
                             : answers[currentQuestion.id] === option.option_value;

                             return (
                                <div 
                                    key={option.id}
                                    onClick={() => handleAnswerChange(currentQuestion.id, option.option_value, currentQuestion.question_type !== 'radio')}
                                    className={cn(
                                        "group relative flex items-center p-4 md:p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 select-none",
                                        isSelected 
                                            ? "border-blue-600 bg-blue-50/50 shadow-md shadow-blue-900/5" 
                                            : "border-slate-100 bg-white hover:border-blue-300 hover:bg-slate-50"
                                    )}
                                >
                                    <div className={cn(
                                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200 mr-4",
                                        isSelected 
                                            ? "border-blue-600 bg-blue-600 text-white" 
                                            : "border-slate-300 bg-white group-hover:border-blue-400"
                                    )}>
                                        {currentQuestion.question_type === 'radio' ? (
                                            isSelected && <Circle className="h-2.5 w-2.5 fill-current" />
                                        ) : (
                                            isSelected && <Check className="h-4 w-4" />
                                        )}
                                    </div>
                                    
                                    <span className={cn(
                                        "text-lg font-medium transition-colors",
                                        isSelected ? "text-blue-900" : "text-slate-700"
                                    )}>
                                        {option.option_text}
                                    </span>
                                </div>
                             )
                        })}
                    </div>
                  )}
                </div>

                {/* Footer Navigation */}
                <div className="flex gap-4 pt-6 border-t border-slate-100 mt-8">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={handlePrevious}
                    className="flex-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 h-14 rounded-xl"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" /> Zurück
                  </Button>
                  
                  {isLastQuestion ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white h-14 text-lg rounded-xl shadow-lg shadow-emerald-900/20"
                    >
                      {submitting ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sende...</>
                      ) : (
                        <><CheckCircle2 className="mr-2 h-5 w-5" /> Jetzt Auswerten</>
                      )}
                    </Button>
                  ) : (
                    <Button 
                        onClick={handleNext} 
                        className="flex-[2] bg-blue-900 hover:bg-blue-800 text-white h-14 text-lg rounded-xl shadow-lg shadow-blue-900/20"
                    >
                      Weiter
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}