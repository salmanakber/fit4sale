'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
      newErrors.patientName = 'Name is required'
    }

    if (!formData.patientEmail.trim()) {
      newErrors.patientEmail = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.patientEmail)) {
      newErrors.patientEmail = 'Please enter a valid email'
    }

    if (!formData.ageGroup) {
      newErrors.ageGroup = 'Age group is required'
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

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8 text-center">
        <h2 className="mb-2 text-2xl font-bold text-primary">Thank you!</h2>
        <p className="mb-4 text-foreground">
          Your fitness evaluation has been submitted successfully. Our team will review your
          responses and send you personalized recommendations within 2-3 business days.
        </p>
        <Button onClick={() => setSubmitted(false)}>Submit Another Response</Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
      <div className="rounded-lg border border-border bg-card p-8">
        <FieldSet>
          <FieldLegend className="text-3xl">Fitness Evaluation Survey</FieldLegend>
          <FieldDescription className="text-base">
            Help us understand your fitness background and goals so we can provide personalized
            recommendations tailored to your needs.
          </FieldDescription>

          <FieldSeparator />

          {/* Personal Information */}
          <FieldSet>
            <FieldLegend variant="label" className="text-xl">
              Personal Information
            </FieldLegend>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="name">Full Name *</FieldLabel>
                <Input
                  id="name"
                  value={formData.patientName}
                  onChange={(e) => handleChange('patientName', e.target.value)}
                  placeholder="John Doe"
                />
                {errors.patientName && <FieldError>{errors.patientName}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email Address *</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={formData.patientEmail}
                  onChange={(e) => handleChange('patientEmail', e.target.value)}
                  placeholder="john@example.com"
                />
                {errors.patientEmail && <FieldError>{errors.patientEmail}</FieldError>}
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="age">Age Group *</FieldLabel>
                  <Select value={formData.ageGroup} onValueChange={(val) => handleChange('ageGroup', val)}>
                    <SelectTrigger id="age">
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18-25">18-25 years</SelectItem>
                      <SelectItem value="26-35">26-35 years</SelectItem>
                      <SelectItem value="36-45">36-45 years</SelectItem>
                      <SelectItem value="46-55">46-55 years</SelectItem>
                      <SelectItem value="56-65">56-65 years</SelectItem>
                      <SelectItem value="65+">65+ years</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.ageGroup && <FieldError>{errors.ageGroup}</FieldError>}
                </Field>

                <Field>
                  <FieldLabel htmlFor="gender">Gender</FieldLabel>
                  <Select value={formData.gender} onValueChange={(val) => handleChange('gender', val)}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          {/* Fitness Background */}
          <FieldSet>
            <FieldLegend variant="label" className="text-xl">
              Fitness Background
            </FieldLegend>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="activity">Current Activity Level</FieldLabel>
                <Select
                  value={formData.currentActivityLevel}
                  onValueChange={(val) => handleChange('currentActivityLevel', val)}
                >
                  <SelectTrigger id="activity">
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (Little or no exercise)</SelectItem>
                    <SelectItem value="light">Light (1-3 days/week)</SelectItem>
                    <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                    <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                    <SelectItem value="very-active">Very Active (Professional athlete)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="experience">Fitness Experience</FieldLabel>
                <Select
                  value={formData.fitnessExperience}
                  onValueChange={(val) => handleChange('fitnessExperience', val)}
                >
                  <SelectTrigger id="experience">
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (New to fitness)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                    <SelectItem value="advanced">Advanced (3+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="equipment">Equipment Access</FieldLabel>
                <Select
                  value={formData.equipmentAccess}
                  onValueChange={(val) => handleChange('equipmentAccess', val)}
                >
                  <SelectTrigger id="equipment">
                    <SelectValue placeholder="Select equipment access" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No equipment</SelectItem>
                    <SelectItem value="home">Home equipment</SelectItem>
                    <SelectItem value="gym">Gym membership</SelectItem>
                    <SelectItem value="both">Both home and gym</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="time">Time Available for Exercise</FieldLabel>
                <Select
                  value={formData.timeAvailable}
                  onValueChange={(val) => handleChange('timeAvailable', val)}
                >
                  <SelectTrigger id="time">
                    <SelectValue placeholder="Select time available" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="less-30">Less than 30 minutes</SelectItem>
                    <SelectItem value="30-60">30-60 minutes</SelectItem>
                    <SelectItem value="60-90">60-90 minutes</SelectItem>
                    <SelectItem value="90+">90+ minutes</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          {/* Health & Goals */}
          <FieldSet>
            <FieldLegend variant="label" className="text-xl">
              Health & Goals
            </FieldLegend>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="goals">What are your main fitness goals?</FieldLabel>
                <Textarea
                  id="goals"
                  value={formData.healthGoals}
                  onChange={(e) => handleChange('healthGoals', e.target.value)}
                  placeholder="e.g., Build muscle, lose weight, improve cardiovascular health..."
                  rows={3}
                />
                <FieldDescription>
                  Tell us what you want to achieve with your fitness program.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="injuries">Any injuries or health conditions?</FieldLabel>
                <Textarea
                  id="injuries"
                  value={formData.injuriesConditions}
                  onChange={(e) => handleChange('injuriesConditions', e.target.value)}
                  placeholder="e.g., Lower back pain, knee issues, asthma..."
                  rows={3}
                />
                <FieldDescription>
                  Please list any injuries, chronic conditions, or health concerns we should know
                  about.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="motivation">What motivates you to exercise?</FieldLabel>
                <Textarea
                  id="motivation"
                  value={formData.motivation}
                  onChange={(e) => handleChange('motivation', e.target.value)}
                  placeholder="e.g., Feel better, improve health, prepare for an event..."
                  rows={3}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="challenges">What challenges do you face?</FieldLabel>
                <Textarea
                  id="challenges"
                  value={formData.challenges}
                  onChange={(e) => handleChange('challenges', e.target.value)}
                  placeholder="e.g., Lack of motivation, time constraints, uncertainty about proper form..."
                  rows={3}
                />
                <FieldDescription>
                  What barriers prevent you from exercising regularly?
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          {/* Additional Information */}
          <Field>
            <FieldLabel htmlFor="comments">Additional Comments</FieldLabel>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => handleChange('comments', e.target.value)}
              placeholder="Any other information you'd like us to know..."
              rows={3}
            />
          </Field>

          <div className="mt-8 flex gap-3">
            <Button type="submit" disabled={isSubmitting} size="lg" className="flex-1 md:flex-none">
              {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setFormData({
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
              })}
              className="flex-1 md:flex-none"
            >
              Clear Form
            </Button>
          </div>
        </FieldSet>
      </div>
    </form>
  )
}
