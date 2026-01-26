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
  Check,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Interfaces ---
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
  // --- State ---
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [currentStep, setCurrentStep] = useState<'intro' | 'contact' | number>('intro');
  
  // Data State
  const [answers, setAnswers] = useState<Answers>({});
  
  // Contact Form State
  const [title, setTitle] = useState<'Herr' | 'Frau' | ''>('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  
  // UI State
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [submitting, setSubmitting] = useState(false);

  // --- Fetch Data ---
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

  // --- Handlers ---
  const handleAnswerChange = (questionId: string, value: string, isMultiple: boolean) => {
    if (isMultiple) {
      const currentAnswers = (answers[questionId] as string[]) || [];
      if (currentAnswers.includes(value)) {
        setAnswers({ ...answers, [questionId]: currentAnswers.filter((a) => a !== value) });
      } else {
        setAnswers({ ...answers, [questionId]: [...currentAnswers, value] });
      }
    } else {
      setAnswers({ ...answers, [questionId]: value });
      // Optional: Auto-advance for radio buttons (feels nice on mobile)
      // setTimeout(() => handleNext(), 250);
    }
  };

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleNext = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (currentStep === 'intro') {
      setCurrentStep('contact');
    } 
    else if (currentStep === 'contact') {
      // Validate Contact Form
      const errors: {[key: string]: string} = {};
      
      if (!title) errors.title = "Bitte wählen";
      if (!firstName.trim()) errors.firstName = "Vorname fehlt";
      if (!lastName.trim()) errors.lastName = "Nachname fehlt";
      if (!email.trim()) errors.email = "E-Mail fehlt";
      else if (!validateEmail(email)) errors.email = "Ungültige E-Mail";

      setFormErrors(errors);

      if (Object.keys(errors).length === 0) {
        setCurrentStep(0); // Start questions
      }
    } 
    else if (typeof currentStep === 'number') {
      const nextStep = currentStep + 1;
      if (quizData && nextStep < quizData.questions.length) {
        setCurrentStep(nextStep);
      }
    }
  };

  const handlePrevious = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (currentStep === 'contact') {
      setCurrentStep('intro');
    } else if (typeof currentStep === 'number') {
      const prevStep = currentStep - 1;
      if (prevStep >= 0) {
        setCurrentStep(prevStep);
      } else {
        setCurrentStep('contact');
      }
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        participant_email: email,
        title,
        first_name: firstName,
        last_name: lastName,
        answers,
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Loading State ---
 if (loading || !quizData) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-blue-900" />
      <p className="text-slate-500 font-medium">Lade Quiz...</p>
    </div>
  );
}


  // --- Progress Logic ---
  const totalSteps = quizData.questions.length;
  const isIntro = currentStep === 'intro';
  const isContactStep = currentStep === 'contact';
  const questionIndex = typeof currentStep === 'number' ? currentStep : -1;
  const currentQuestion = typeof currentStep === 'number' ? quizData.questions[currentStep] : null;
  const isLastQuestion = typeof currentStep === 'number' && currentStep === totalSteps - 1;
  
  let progressPercent = 0;
  if (!isIntro) {
     if (isContactStep) progressPercent = 5;
     else progressPercent = 5 + (((questionIndex + 1) / totalSteps) * 95);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Mobile Header Logo */}
      <div className="mb-6 w-full max-w-3xl flex justify-center md:justify-start">
          <div className="relative h-12 w-32">
             <Image
                src="/fit4sale-logo.png"
                alt="Fit4Sale Logo"
                fill
                className="object-contain"
              />
          </div>
      </div>

      <div className="w-full max-w-3xl relative">
        
        {/* Floating Progress Bar */}
        {!isIntro && (
          <div className="mb-6 px-1 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex justify-between items-center mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>
                 {isContactStep ? "Ihre Daten" : `Frage ${questionIndex + 1} von ${totalSteps}`}
              </span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 w-full bg-white rounded-full overflow-hidden shadow-sm border border-slate-100">
              <div
                className="h-full bg-blue-900 rounded-full transition-all duration-700 ease-out"
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
                <img
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
        {/* Main Card */}
        <Card className="overflow-hidden rounded-3xl border-0 shadow-2xl shadow-blue-900/5 bg-white">
          <div className="p-6 md:p-10 lg:p-12">
            
            {/* --- SCREEN 1: INTRO --- */}
            {isIntro ? (
              <div className="flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="space-y-4 max-w-lg">
                  <h1 className="text-3xl md:text-5xl font-bold text-blue-950 tracking-tight leading-tight">
                    {quizData.intro.title}
                  </h1>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    {quizData.intro.description}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-6 py-3 text-blue-800 font-semibold shadow-sm">
                  <Clock className="h-5 w-5" />
                  <span>{quizData.intro.estimated_time}</span>
                </div>

              <Button
                onClick={handleNext}
                size="lg"
                className="mt-8 w-full md:w-auto"
              >
                Start
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
                  Bitte geben Sie Ihre E-Mail-Adresse ein, damit wir Ihnen die Auswertung senden können.
                </p>
                <div className="w-full max-w-xs pt-4">
                    <Button
                        onClick={handleNext}
                        size="lg"
                        className="w-full h-14 text-lg font-bold bg-blue-900 hover:bg-blue-800 text-white shadow-xl shadow-blue-900/20 rounded-2xl transition-transform active:scale-95"
                    >
                        {quizData.intro.button_text || "Jetzt Starten"}
                    </Button>
                </div>
              </div>
            ) : null}

            {/* --- SCREEN 2: CONTACT FORM --- */}
            {isContactStep && (
              <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                <div className="text-center md:text-left space-y-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-blue-950">
                    Ihre Kontaktdaten
                  </h2>
                  <p className="text-slate-500 text-lg">
                    Für Ihre persönliche Auswertung.
                  </p>
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
                            value={option.option_value}
                            checked={
                              answers[currentQuestion.id] === option.option_value
                            }
                            onChange={() =>
                              handleAnswerChange(
                                currentQuestion.id,
                                option.option_value,
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
                            value={option.option_value}
                            checked={
                              Array.isArray(answers[currentQuestion.id])
                                ? (answers[currentQuestion.id] as string[]).includes(option.option_value)
                                : false
                            }
                            onChange={() =>
                              handleAnswerChange(
                                currentQuestion.id,
                                option.option_value,
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
                <div className="space-y-5">
                  
                  {/* Title Selection */}
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Anrede</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Herr', 'Frau'].map((option) => (
                        <div
                          key={option}
                          onClick={() => {
                            setTitle(option as any);
                            setFormErrors(prev => ({...prev, title: ''}));
                          }}
                          className={cn(
                            "cursor-pointer rounded-xl border-2 py-3 px-4 text-center font-medium transition-all",
                            title === option 
                              ? "border-blue-600 bg-blue-50 text-blue-900" 
                              : "border-slate-100 bg-slate-50 text-slate-500 hover:bg-white hover:border-blue-200",
                            formErrors.title && !title && "border-red-300 bg-red-50"
                          )}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                    {formErrors.title && <p className="text-xs text-red-500 mt-1 ml-1">{formErrors.title}</p>}
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Vorname</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            setFormErrors(prev => ({...prev, firstName: ''}));
                          }}
                          className={cn(
                            "w-full pl-12 pr-4 h-14 bg-slate-50 border-2 rounded-xl focus:outline-none transition-all text-lg",
                            formErrors.firstName ? "border-red-300 bg-red-50" : "border-slate-100 focus:border-blue-600 focus:bg-white"
                          )}
                          placeholder="Max"
                        />
                      </div>
                      {formErrors.firstName && <p className="text-xs text-red-500 mt-1 ml-1">{formErrors.firstName}</p>}
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Nachname</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          setFormErrors(prev => ({...prev, lastName: ''}));
                        }}
                        className={cn(
                          "w-full px-4 h-14 bg-slate-50 border-2 rounded-xl focus:outline-none transition-all text-lg",
                          formErrors.lastName ? "border-red-300 bg-red-50" : "border-slate-100 focus:border-blue-600 focus:bg-white"
                        )}
                        placeholder="Mustermann"
                      />
                      {formErrors.lastName && <p className="text-xs text-red-500 mt-1 ml-1">{formErrors.lastName}</p>}
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">E-Mail-Adresse</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setFormErrors(prev => ({...prev, email: ''}));
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                        className={cn(
                            "w-full pl-12 pr-4 h-14 bg-slate-50 border-2 rounded-xl focus:outline-none transition-all text-lg",
                            formErrors.email ? "border-red-300 bg-red-50" : "border-slate-100 focus:border-blue-600 focus:bg-white"
                        )}
                        placeholder="name@beispiel.de"
                      />
                    </div>
                    {formErrors.email && <p className="text-xs text-red-500 mt-1 ml-1">{formErrors.email}</p>}
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={handlePrevious}
                    className="h-14 px-6 text-slate-500 hover:text-slate-900 rounded-xl"
                  >
                    {submitting ? 'Wird eingereicht...' : 'Absenden'}
                    Zurück
                  </Button>
                  <Button 
                    onClick={handleNext} 
                    className="flex-1 h-14 bg-blue-900 hover:bg-blue-800 text-white text-lg font-semibold rounded-xl shadow-lg shadow-blue-900/10"
                  >
                    Weiter <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* --- SCREEN 3: QUESTIONS --- */}
            {currentQuestion && (
              <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500" key={currentQuestion.id}>
                
                {/* Question Header */}
                <div className="space-y-4">
                    <span className="inline-block text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wide">
                        {currentQuestion.question_type === 'radio' ? 'Bitte wählen Sie eine Option' : 'Mehrfachauswahl möglich'}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-blue-950 leading-snug">
                       {currentQuestion.question_text}
                    </h2>
                </div>

                {/* Options / Input Area */}
                <div className="space-y-3">
                  {currentQuestion.question_type === 'textarea' ? (
                    <textarea
                        value={typeof answers[currentQuestion.id] === 'string' ? answers[currentQuestion.id] : ''}
                        onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                        autoFocus
                        placeholder="Tippen Sie hier..."
                        rows={6}
                        className="w-full p-5 text-lg bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all resize-none text-slate-900"
                    />
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
                                        "group relative flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 select-none active:scale-[0.99]",
                                        isSelected 
                                            ? "border-blue-600 bg-blue-50/60 shadow-inner" 
                                            : "border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50 hover:shadow-sm"
                                    )}
                                >
                                    {/* Custom Checkbox/Radio UI */}
                                    <div className={cn(
                                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200 mr-4",
                                        isSelected 
                                            ? "border-blue-600 bg-blue-600 text-white" 
                                            : "border-slate-200 bg-slate-50 group-hover:border-blue-300"
                                    )}>
                                        {currentQuestion.question_type === 'radio' ? (
                                            isSelected && <Circle className="h-2.5 w-2.5 fill-current" />
                                        ) : (
                                            isSelected && <Check className="h-4 w-4" />
                                        )}
                                    </div>
                                    
                                    <span className={cn(
                                        "text-lg font-medium transition-colors leading-snug",
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

                {/* Navigation Footer */}
                <div className="flex gap-3 pt-6 border-t border-slate-100 mt-8">
                  <Button
                    variant="ghost"
                    onClick={handlePrevious}
                    className="h-14 w-14 p-0 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </Button>
                  
                  {isLastQuestion ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold rounded-2xl shadow-lg shadow-emerald-900/20"
                    >
                      {submitting ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verarbeite...</>
                      ) : (
                        <><CheckCircle2 className="mr-2 h-5 w-5" /> Auswertung anfordern</>
                      )}
                    </Button>
                  ) : (
                    <Button 
                        onClick={handleNext} 
                        className="flex-1 h-14 bg-blue-900 hover:bg-blue-800 text-white text-lg font-bold rounded-2xl shadow-lg shadow-blue-900/20"
                    >
                      Weiter
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
