'use client';

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  User, 
  Dumbbell, 
  HeartPulse, 
  MessageSquare, 
  CheckCircle2, 
  Send,
  RotateCcw,
  Loader2,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SurveyFormData {
  patientName: string
  patientEmail: string
  ageGroup: string
  gender: string
  currentActivityLevel: string
  healthGoals: string
  injuriesConditions: string
  equipmentAccess: string
  timeAvailable: string
  fitnessExperience: string
  motivation: string
  challenges: string
  comments: string
}

export function SurveyForm() {
  const [formData, setFormData] = useState<SurveyFormData>({
    patientName: '',
    patientEmail: '',
    ageGroup: '',
    gender: '',
    currentActivityLevel: '',
    healthGoals: '',
    injuriesConditions: '',
    equipmentAccess: '',
    timeAvailable: '',
    fitnessExperience: '',
    motivation: '',
    challenges: '',
    comments: '',
  })

  const [errors, setErrors] = useState<Partial<SurveyFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Partial<SurveyFormData> = {}

    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Name ist erforderlich'
    }

    if (!formData.patientEmail.trim()) {
      newErrors.patientEmail = 'Email ist erforderlich'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.patientEmail)) {
      newErrors.patientEmail = 'Bitte eine gültige Email eingeben'
    }

    if (!formData.ageGroup) {
      newErrors.ageGroup = 'Altersgruppe ist erforderlich'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof SurveyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      // Scroll to top if errors exist
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/submit-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitted(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setFormData({
            patientName: '',
            patientEmail: '',
            ageGroup: '',
            gender: '',
            currentActivityLevel: '',
            healthGoals: '',
            injuriesConditions: '',
            equipmentAccess: '',
            timeAvailable: '',
            fitnessExperience: '',
            motivation: '',
            challenges: '',
            comments: '',
        })
      }
    } catch (error) {
      console.error('Error submitting survey:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper for Section Headers
  const FormSectionHeader = ({ icon: Icon, title, description }: any) => (
    <div className="mb-6 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-900">
                <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-blue-950 uppercase tracking-wide">{title}</h3>
        </div>
        {description && <p className="text-sm text-slate-500 ml-11">{description}</p>}
    </div>
  )

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl mt-12 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xl shadow-blue-900/5">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="mb-3 text-3xl font-bold text-blue-950">Vielen Dank!</h2>
          <p className="mb-8 text-lg text-slate-600 leading-relaxed">
            Ihre Fitness-Evaluation wurde erfolgreich übermittelt. <br/>
            Unser Expertenteam wird Ihre Antworten analysieren und Ihnen in Kürze einen persönlichen Plan zusenden.
          </p>
          <Button 
            onClick={() => setSubmitted(false)} 
            className="bg-blue-900 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20"
          >
            Neue Eingabe starten
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
        
        {/* Header Card */}
        <div className="overflow-hidden rounded-t-2xl bg-blue-950 text-white shadow-lg">
            <div className="p-8 md:p-10">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Fitness Evaluation</h1>
                        <p className="mt-2 text-blue-200 text-lg">
                            Persönliche Anamnese & Zielsetzung
                        </p>
                    </div>
                    {/* Optional: Add Logo Here */}
                    <div className="hidden md:block opacity-20">
                        <Dumbbell className="h-16 w-16" />
                    </div>
                </div>
            </div>
            <div className="bg-blue-900/50 px-8 py-3 text-xs font-medium uppercase tracking-wider text-blue-200 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Formular ID: FIT-{new Date().getFullYear()}
            </div>
        </div>

        {/* Form Body */}
        <div className="rounded-b-2xl border-x border-b border-slate-200 bg-white p-8 md:p-10 shadow-xl shadow-slate-200/50 space-y-10">
            
            {/* Personal Information */}
            <section>
                <FormSectionHeader 
                    icon={User} 
                    title="Persönliche Daten" 
                    description="Basisinformationen für Ihre Akte."
                />
                <FieldGroup className="grid gap-6 md:grid-cols-2">
                    <Field className="md:col-span-1">
                        <FieldLabel htmlFor="name" className="text-blue-950 font-semibold">Vollständiger Name *</FieldLabel>
                        <Input
                            id="name"
                            value={formData.patientName}
                            onChange={(e) => handleChange('patientName', e.target.value)}
                            placeholder="Max Mustermann"
                            className={cn("bg-slate-50 border-slate-200 focus:border-blue-500", errors.patientName && "border-red-500")}
                        />
                        {errors.patientName && <FieldError className="text-red-500">{errors.patientName}</FieldError>}
                    </Field>

                    <Field className="md:col-span-1">
                        <FieldLabel htmlFor="email" className="text-blue-950 font-semibold">E-Mail Adresse *</FieldLabel>
                        <Input
                            id="email"
                            type="email"
                            value={formData.patientEmail}
                            onChange={(e) => handleChange('patientEmail', e.target.value)}
                            placeholder="max@beispiel.de"
                            className={cn("bg-slate-50 border-slate-200 focus:border-blue-500", errors.patientEmail && "border-red-500")}
                        />
                        {errors.patientEmail && <FieldError className="text-red-500">{errors.patientEmail}</FieldError>}
                    </Field>

                    <Field className="md:col-span-1">
                        <FieldLabel htmlFor="age" className="text-blue-950 font-semibold">Altersgruppe *</FieldLabel>
                        <Select value={formData.ageGroup} onValueChange={(val) => handleChange('ageGroup', val)}>
                            <SelectTrigger id="age" className={cn("bg-slate-50 border-slate-200", errors.ageGroup && "border-red-500")}>
                            <SelectValue placeholder="Bitte wählen" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="18-25">18-25 Jahre</SelectItem>
                            <SelectItem value="26-35">26-35 Jahre</SelectItem>
                            <SelectItem value="36-45">36-45 Jahre</SelectItem>
                            <SelectItem value="46-55">46-55 Jahre</SelectItem>
                            <SelectItem value="56-65">56-65 Jahre</SelectItem>
                            <SelectItem value="65+">65+ Jahre</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.ageGroup && <FieldError className="text-red-500">{errors.ageGroup}</FieldError>}
                    </Field>

                    <Field className="md:col-span-1">
                        <FieldLabel htmlFor="gender" className="text-blue-950 font-semibold">Geschlecht</FieldLabel>
                        <Select value={formData.gender} onValueChange={(val) => handleChange('gender', val)}>
                            <SelectTrigger id="gender" className="bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Bitte wählen" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="male">Männlich</SelectItem>
                            <SelectItem value="female">Weiblich</SelectItem>
                            <SelectItem value="other">Divers</SelectItem>
                            <SelectItem value="prefer-not">Keine Angabe</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                </FieldGroup>
            </section>

            {/* Fitness Background */}
            <section>
                <FormSectionHeader 
                    icon={Dumbbell} 
                    title="Fitness Hintergrund" 
                    description="Helfen Sie uns, Ihr aktuelles Leistungsniveau einzuschätzen."
                />
                <FieldGroup className="grid gap-6 md:grid-cols-2">
                    <Field>
                        <FieldLabel htmlFor="activity" className="text-blue-950 font-semibold">Aktuelles Aktivitätslevel</FieldLabel>
                        <Select
                            value={formData.currentActivityLevel}
                            onValueChange={(val) => handleChange('currentActivityLevel', val)}
                        >
                            <SelectTrigger id="activity" className="bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Bitte wählen" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sedentary">Inaktiv (Kein Sport)</SelectItem>
                                <SelectItem value="light">Leicht (1-3 Tage/Woche)</SelectItem>
                                <SelectItem value="moderate">Moderat (3-5 Tage/Woche)</SelectItem>
                                <SelectItem value="active">Aktiv (6-7 Tage/Woche)</SelectItem>
                                <SelectItem value="very-active">Sehr Aktiv (Leistungssport)</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="experience" className="text-blue-950 font-semibold">Trainingserfahrung</FieldLabel>
                        <Select
                            value={formData.fitnessExperience}
                            onValueChange={(val) => handleChange('fitnessExperience', val)}
                        >
                            <SelectTrigger id="experience" className="bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Bitte wählen" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="beginner">Anfänger (Neu)</SelectItem>
                                <SelectItem value="intermediate">Fortgeschritten (1-3 Jahre)</SelectItem>
                                <SelectItem value="advanced">Profi (3+ Jahre)</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="equipment" className="text-blue-950 font-semibold">Zugang zu Equipment</FieldLabel>
                        <Select
                            value={formData.equipmentAccess}
                            onValueChange={(val) => handleChange('equipmentAccess', val)}
                        >
                            <SelectTrigger id="equipment" className="bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Bitte wählen" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Kein Equipment</SelectItem>
                                <SelectItem value="home">Home Gym / Kleingeräte</SelectItem>
                                <SelectItem value="gym">Fitnessstudio</SelectItem>
                                <SelectItem value="both">Beides</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="time" className="text-blue-950 font-semibold">Zeit pro Einheit</FieldLabel>
                        <Select
                            value={formData.timeAvailable}
                            onValueChange={(val) => handleChange('timeAvailable', val)}
                        >
                            <SelectTrigger id="time" className="bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Bitte wählen" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="less-30">Weniger als 30 Min</SelectItem>
                                <SelectItem value="30-60">30-60 Minuten</SelectItem>
                                <SelectItem value="60-90">60-90 Minuten</SelectItem>
                                <SelectItem value="90+">90+ Minuten</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                </FieldGroup>
            </section>

            {/* Health & Goals */}
            <section>
                <FormSectionHeader 
                    icon={HeartPulse} 
                    title="Gesundheit & Ziele" 
                    description="Definieren Sie Ihre Ziele und informieren Sie uns über Einschränkungen."
                />
                <FieldGroup className="space-y-6">
                <Field>
                    <FieldLabel htmlFor="goals" className="text-blue-950 font-semibold">Was sind Ihre Hauptziele?</FieldLabel>
                    <Textarea
                        id="goals"
                        value={formData.healthGoals}
                        onChange={(e) => handleChange('healthGoals', e.target.value)}
                        placeholder="z.B. Muskelaufbau, Gewichtsverlust, Ausdauer verbessern..."
                        rows={3}
                        className="bg-slate-50 border-slate-200 focus:border-blue-500 resize-none"
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="injuries" className="text-blue-950 font-semibold">Verletzungen oder Einschränkungen?</FieldLabel>
                    <Textarea
                        id="injuries"
                        value={formData.injuriesConditions}
                        onChange={(e) => handleChange('injuriesConditions', e.target.value)}
                        placeholder="z.B. Rückenschmerzen, Knieprobleme, Asthma..."
                        rows={3}
                        className="bg-slate-50 border-slate-200 focus:border-blue-500 resize-none"
                    />
                </Field>
                
                <div className="grid gap-6 md:grid-cols-2">
                    <Field>
                        <FieldLabel htmlFor="motivation" className="text-blue-950 font-semibold">Was motiviert Sie?</FieldLabel>
                        <Textarea
                            id="motivation"
                            value={formData.motivation}
                            onChange={(e) => handleChange('motivation', e.target.value)}
                            placeholder="z.B. Wohlbefinden, Vorbereitung auf Event..."
                            rows={3}
                            className="bg-slate-50 border-slate-200 focus:border-blue-500 resize-none"
                        />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="challenges" className="text-blue-950 font-semibold">Größte Herausforderungen?</FieldLabel>
                        <Textarea
                            id="challenges"
                            value={formData.challenges}
                            onChange={(e) => handleChange('challenges', e.target.value)}
                            placeholder="z.B. Zeitmangel, Motivation, Unsicherheit..."
                            rows={3}
                            className="bg-slate-50 border-slate-200 focus:border-blue-500 resize-none"
                        />
                    </Field>
                </div>
                </FieldGroup>
            </section>

            {/* Additional Information */}
            <section>
                <FormSectionHeader 
                    icon={MessageSquare} 
                    title="Sonstiges" 
                />
                <Field>
                    <FieldLabel htmlFor="comments" className="text-blue-950 font-semibold">Zusätzliche Anmerkungen</FieldLabel>
                    <Textarea
                        id="comments"
                        value={formData.comments}
                        onChange={(e) => handleChange('comments', e.target.value)}
                        placeholder="Gibt es noch etwas, das wir wissen sollten?"
                        rows={3}
                        className="bg-slate-50 border-slate-200 focus:border-blue-500 resize-none"
                    />
                </Field>
            </section>

            {/* Footer Actions */}
            <div className="flex flex-col-reverse md:flex-row gap-4 pt-4 border-t border-slate-100">
                <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                        if(confirm('Möchten Sie das Formular wirklich zurücksetzen?')) {
                            setFormData({
                                patientName: '',
                                patientEmail: '',
                                ageGroup: '',
                                gender: '',
                                currentActivityLevel: '',
                                healthGoals: '',
                                injuriesConditions: '',
                                equipmentAccess: '',
                                timeAvailable: '',
                                fitnessExperience: '',
                                motivation: '',
                                challenges: '',
                                comments: '',
                            })
                        }
                    }}
                    className="flex-1 text-slate-500 hover:text-red-500 hover:bg-red-50"
                >
                    <RotateCcw className="mr-2 h-4 w-4" /> Formular leeren
                </Button>

                <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    size="lg" 
                    className="flex-[2] bg-blue-900 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20 text-lg h-14"
                >
                    {isSubmitting ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Wird gesendet...</>
                    ) : (
                        <><Send className="mr-2 h-5 w-5" /> Evaluation Absenden</>
                    )}
                </Button>
            </div>
        </div>
        </form>
    </div>
  )
}