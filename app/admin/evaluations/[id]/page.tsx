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
  quiz_submissions: {
    patient_name: string
    patient_email: string | null
    participant_email: string | null
    full_evaluation_approved: boolean | null
    approved_by_admin: string | null
    approved_at: string | null
  }
}

export default function EvaluationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const evaluationId = params.id as string
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

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
        const err = await response.json().catch(() => null)
        alert(err?.error || 'Failed to send email')
      }
    } catch (error) {
      console.error('[v0] Error sending email:', error)
      alert('Error sending email')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleApprove = async () => {
    if (!evaluation) return
    setIsApproving(true)
    try {
      const res = await fetch(`/api/admin/submissions/${evaluation.submission_id}/approve`, {
        method: 'POST',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        alert(err?.error || 'Failed to approve')
        return
      }
      // refresh evaluation so approval status updates
      const refreshed = await fetch(`/api/admin/evaluations/${evaluationId}`)
      if (refreshed.ok) {
        const data = await refreshed.json()
        setEvaluation(data.evaluation)
      }
      alert('Approved. You can now send the full evaluation email.')
    } catch (e) {
      console.error('[v0] Error approving:', e)
      alert('Error approving')
    } finally {
      setIsApproving(false)
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

  const isApproved = !!evaluation.quiz_submissions.full_evaluation_approved

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
            {evaluation.quiz_submissions.patient_name}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleApprove}
            disabled={isApproving || isApproved}
            size="sm"
          >
            {isApproved ? 'Approved' : isApproving ? 'Approving...' : 'Approve'}
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={isSendingEmail || !isApproved}
            size="sm"
            title={!isApproved ? 'Approve first to send the full evaluation email' : undefined}
          >
            {isSendingEmail ? 'Sending...' : 'Send Full Email'}
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Approval Status */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-semibold text-muted-foreground mb-2">Approval</div>
          <div className="text-foreground">
            {isApproved ? 'Approved' : 'Not approved yet'}
          </div>
          {evaluation.quiz_submissions.approved_at && (
            <div className="text-sm text-muted-foreground mt-1">
              Approved at:{' '}
              {new Date(evaluation.quiz_submissions.approved_at).toLocaleString()}
            </div>
          )}
        </div>

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
          <SectionField label="Name" value={evaluation.quiz_submissions.patient_name} />
          <SectionField
            label="Email"
            value={
              evaluation.quiz_submissions.patient_email ||
              evaluation.quiz_submissions.participant_email ||
              '-'
            }
          />
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
