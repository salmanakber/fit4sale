'use client'

import React from "react"
import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import { calculateEvaluationScore, type SurveyData } from '@/lib/evaluation-logic'


interface SubmissionData {
  id: string
  patient_name: string
  patient_email: string
  age_group: string
  current_activity_level: string
  health_goals: string
  injuries_conditions: string
  equipment_access: string
  time_available: string
  fitness_experience: string
  motivation: string
  challenges: string
}

const Loading = () => null

export default function CreateEvaluationPage() {
  const router = useRouter()

  const [submission, setSubmission] = useState<SubmissionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [autoScore, setAutoScore] = useState(true)
  const [showAutoScore, setShowAutoScore] = useState(false)

  const [evaluation, setEvaluation] = useState({
    fitnesLevelScore: '',
    readinessScore: '',
    recommendedProgram: '',
    safetyConserns: '',
    personalisedRecommendations: '',
    programDuration: '',
    intensityLevel: '',
    specialModifications: '',
  })

  const fetchSubmission = async (submissionId: string) => {
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`)
      if (response.ok) {
        const data = await response.json()
        setSubmission(data.submission)

        // Auto-calculate score
        if (autoScore) {
          const surveyData: SurveyData = {
            ageGroup: data.submission.age_group,
            currentActivityLevel: data.submission.current_activity_level,
            fitnessExperience: data.submission.fitness_experience,
            injuriesConditions: data.submission.injuries_conditions,
            equipmentAccess: data.submission.equipment_access,
            timeAvailable: data.submission.time_available,
          }

          const score = calculateEvaluationScore(surveyData)
          setEvaluation({
            fitnesLevelScore: score.fitnessLevelScore.toString(),
            readinessScore: score.readinessScore.toString(),
            recommendedProgram: score.recommendedProgram,
            safetyConcerns: score.safetyConcerns,
            personalizedRecommendations: score.personalisedRecommendations,
            programDuration: score.programDuration,
            intensityLevel: score.intensityLevel,
            specialModifications: score.specialModifications,
          })
          setShowAutoScore(true)
        }
      } else {
        router.push('/admin/submissions')
      }
    } catch (error) {
      console.error('[v0] Error fetching submission:', error)
      router.push('/admin/submissions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/admin/evaluations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          fitnessLevelScore: parseInt(evaluation.fitnesLevelScore),
          readinessScore: parseInt(evaluation.readinessScore),
          recommendedProgram: evaluation.recommendedProgram,
          safetyConcerns: evaluation.safetyConserns,
          personalizedRecommendations: evaluation.personalisedRecommendations,
          programDuration: evaluation.programDuration,
          intensityLevel: evaluation.intensityLevel,
          specialModifications: evaluation.specialModifications,
        }),
      })

      if (response.ok) {
        router.push('/admin/evaluations')
      } else {
        alert('Failed to save evaluation')
      }
    } catch (error) {
      console.error('[v0] Error saving evaluation:', error)
      alert('Error saving evaluation')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Suspense fallback={<Loading />}>
      <div>
        <div className="mb-6 flex items-center gap-4">
          <Link href="/admin/submissions">
            <Button variant="outline" size="sm">
              ← Back
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-foreground">
            Create Evaluation: {submission?.patient_name}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl">
          <div className="rounded-lg border border-border bg-card p-8">
            <FieldSet>
              {showAutoScore && (
                <div className="mb-6 rounded-lg bg-primary/10 p-4 text-sm text-primary">
                  <p className="font-medium mb-2">Auto-calculated evaluation based on survey responses</p>
                  <p>You can adjust these values as needed based on your professional assessment.</p>
                </div>
              )}

              <FieldGroup className="gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="fitness">Fitness Level Score (0-100)</FieldLabel>
                    <Input
                      id="fitness"
                      type="number"
                      min="0"
                      max="100"
                      value={evaluation.fitnesLevelScore}
                      onChange={(e) =>
                        setEvaluation((prev) => ({
                          ...prev,
                          fitnesLevelScore: e.target.value,
                        }))
                      }
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="readiness">Readiness Score (0-100)</FieldLabel>
                    <Input
                      id="readiness"
                      type="number"
                      min="0"
                      max="100"
                      value={evaluation.readinessScore}
                      onChange={(e) =>
                        setEvaluation((prev) => ({
                          ...prev,
                          readinessScore: e.target.value,
                        }))
                      }
                      required
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="program">Recommended Program</FieldLabel>
                  <Input
                    id="program"
                    value={evaluation.recommendedProgram}
                    onChange={(e) =>
                      setEvaluation((prev) => ({
                        ...prev,
                        recommendedProgram: e.target.value,
                      }))
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="intensity">Intensity Level</FieldLabel>
                  <Input
                    id="intensity"
                    value={evaluation.intensityLevel}
                    onChange={(e) =>
                      setEvaluation((prev) => ({
                        ...prev,
                        intensityLevel: e.target.value,
                      }))
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="duration">Program Duration</FieldLabel>
                  <Input
                    id="duration"
                    value={evaluation.programDuration}
                    onChange={(e) =>
                      setEvaluation((prev) => ({
                        ...prev,
                        programDuration: e.target.value,
                      }))
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="modifications">Special Modifications</FieldLabel>
                  <Textarea
                    id="modifications"
                    value={evaluation.specialModifications}
                    onChange={(e) =>
                      setEvaluation((prev) => ({
                        ...prev,
                        specialModifications: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="safety">Safety Concerns</FieldLabel>
                  <Textarea
                    id="safety"
                    value={evaluation.safetyConserns}
                    onChange={(e) =>
                      setEvaluation((prev) => ({
                        ...prev,
                        safetyConserns: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="recommendations">Personalized Recommendations</FieldLabel>
                  <Textarea
                    id="recommendations"
                    value={evaluation.personalisedRecommendations}
                    onChange={(e) =>
                      setEvaluation((prev) => ({
                        ...prev,
                        personalisedRecommendations: e.target.value,
                      }))
                    }
                    rows={4}
                  />
                </Field>
              </FieldGroup>

              <div className="mt-8 flex gap-3">
                <Button type="submit" disabled={isSaving} size="lg">
                  {isSaving ? 'Saving...' : 'Save Evaluation'}
                </Button>
                <Link href="/admin/submissions">
                  <Button type="button" variant="outline" size="lg">
                    Cancel
                  </Button>
                </Link>
              </div>
            </FieldSet>
          </div>
        </form>
      </div>
    </Suspense>
  )
}
