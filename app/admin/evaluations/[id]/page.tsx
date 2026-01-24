'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface EvaluationDetail {
  id: string
  submission_id: string
  fitness_level_score: number
  readiness_score: number
  recommended_program: string
  safety_concerns: string
  personalized_recommendations: string
  program_duration: string
  intensity_level: string
  special_modifications: string
  evaluation_completed_at: string
  survey_submissions: {
    patient_name: string
    patient_email: string
  }
}

export default function EvaluationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const evaluationId = params.id as string
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        const response = await fetch(`/api/admin/evaluations/${evaluationId}`)
        if (response.ok) {
          const data = await response.json()
          setEvaluation(data.evaluation)
        } else {
          router.push('/admin/evaluations')
        }
      } catch (error) {
        console.error('[v0] Error fetching evaluation:', error)
        router.push('/admin/evaluations')
      } finally {
        setIsLoading(false)
      }
    }

    if (evaluationId) {
      fetchEvaluation()
    }
  }, [evaluationId, router])

  const handleSendEmail = async () => {
    setIsSendingEmail(true)
    try {
      const response = await fetch('/api/admin/send-evaluation-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluationId }),
      })

      if (response.ok) {
        alert('Evaluation email sent successfully')
      } else {
        alert('Failed to send email')
      }
    } catch (error) {
      console.error('[v0] Error sending email:', error)
      alert('Error sending email')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const ScoreDisplay = ({ score, label }: { score: number; label: string }) => (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="text-sm font-semibold text-muted-foreground mb-2">{label}</div>
      <div className="flex items-end gap-2">
        <div className="text-4xl font-bold text-primary">{score}</div>
        <div className="text-lg text-muted-foreground mb-1">/100</div>
      </div>
      <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  )

  const SectionField = ({ label, value }: { label: string; value: string }) => (
    <div className="border-b border-border py-4 last:border-b-0">
      <div className="text-sm font-semibold text-muted-foreground">{label}</div>
      <div className="mt-2 text-foreground whitespace-pre-wrap break-words">{value || '-'}</div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
          <p className="text-muted-foreground">Loading evaluation...</p>
        </div>
      </div>
    )
  }

  if (!evaluation) {
    return null
  }

  const recommendationsList = evaluation.personalized_recommendations
    .split(' | ')
    .filter((rec) => rec.trim().length > 0)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/evaluations">
            <Button variant="outline" size="sm">
              ← Back to Evaluations
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-foreground">
            {evaluation.survey_submissions.patient_name}
          </h2>
        </div>
        <Button
          onClick={handleSendEmail}
          disabled={isSendingEmail}
          size="sm"
        >
          {isSendingEmail ? 'Sending...' : 'Send Email to Patient'}
        </Button>
      </div>

      <div className="space-y-8">
        {/* Scores */}
        <div className="grid gap-6 md:grid-cols-2">
          <ScoreDisplay score={evaluation.fitness_level_score} label="Fitness Level Score" />
          <ScoreDisplay score={evaluation.readiness_score} label="Readiness Score" />
        </div>

        {/* Program Details */}
        <div className="rounded-lg border border-border bg-card p-8">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Program Details</h3>
          <SectionField label="Recommended Program" value={evaluation.recommended_program} />
          <SectionField label="Intensity Level" value={evaluation.intensity_level} />
          <SectionField label="Program Duration" value={evaluation.program_duration} />
          <SectionField label="Special Modifications" value={evaluation.special_modifications} />
          <SectionField label="Safety Concerns" value={evaluation.safety_concerns} />
        </div>

        {/* Recommendations */}
        <div className="rounded-lg border border-border bg-card p-8">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Personalized Recommendations
          </h3>
          {recommendationsList.length > 0 ? (
            <ul className="space-y-3">
              {recommendationsList.map((rec, idx) => (
                <li key={idx} className="flex gap-3 text-foreground">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {idx + 1}
                  </div>
                  <div>{rec.trim()}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No additional recommendations</p>
          )}
        </div>

        {/* Patient Info */}
        <div className="rounded-lg border border-border bg-card p-8">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Patient Information</h3>
          <SectionField label="Name" value={evaluation.survey_submissions.patient_name} />
          <SectionField label="Email" value={evaluation.survey_submissions.patient_email} />
          <SectionField
            label="Evaluation Completed"
            value={new Date(evaluation.evaluation_completed_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        </div>
      </div>
    </div>
  )
}
