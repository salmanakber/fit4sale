'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface SubmissionDetail {
  id: string
  patient_name: string | null
  patient_email: string | null
  participant_email: string | null
  answers?: any
  submitted_at?: string | null
  partial_evaluation_sent?: boolean | null
  full_evaluation_pending?: boolean | null
  full_evaluation_approved?: boolean | null
  approved_by_admin?: string | null
  approved_at?: string | null
  created_at: string
}

export default function SubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const submissionId = params.id as string
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<any[] | null>(null)

    useEffect(() => {
      const fetchSubmission = async () => {
        try {
          const response = await fetch(`/api/admin/submissions/${submissionId}`)
          if (response.ok) {
            const data = await response.json()
            setSubmission(data.submission)
            setLoadError(null)
          } else {
            const err = await response.json().catch(() => null)
            if (response.status === 401) {
              router.push('/admin/login')
              return
            }
            setLoadError(err?.error || `Failed to load submission (${response.status})`)
          }
        } catch (error) {
          console.error('[v0] Error fetching submission:', error)
          setLoadError('Network error while loading submission')
        } finally {
          setIsLoading(false)
        }
      }

      if (submissionId) {
        fetchSubmission()
      }
    }, [submissionId, router])

    useEffect(() => {
      const fetchQuiz = async () => {
        try {
          const res = await fetch('/api/quiz')
          if (res.ok) {
            const data = await res.json()
            setQuizQuestions(data.questions || [])
          }
        } catch (e) {
          console.error('[v0] Error fetching quiz questions:', e)
        }
      }
      fetchQuiz()
    }, [])

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

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
            <p className="text-muted-foreground">Loading submission...</p>
          </div>
        </div>
      )
    }

    if (!submission) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/submissions">
              <Button variant="outline" size="sm">
                ← Back to Submissions
              </Button>
            </Link>
          </div>
          <div className="rounded-lg border border-border bg-card p-8">
            <h2 className="text-xl font-semibold text-foreground mb-2">Could not load submission</h2>
            <p className="text-muted-foreground">{loadError || 'Unknown error'}</p>
            <p className="text-muted-foreground mt-2">
              Submission ID: <span className="font-mono">{submissionId}</span>
            </p>
          </div>
        </div>
      )
    }

    const participantEmail = submission.patient_email || submission.participant_email || '-'

    const formatAnswers = () => {
      const answers = submission.answers || {}
      if (!quizQuestions) return []

      const qMap = new Map<string, any>(quizQuestions.map((q) => [q.id, q]))
      const rows: Array<{ question: string; answer: string }> = []

      for (const [qid, val] of Object.entries(answers)) {
        if (qid === 'participant_email') continue
        const q = qMap.get(qid)
        const questionText = q?.question_text || qid
        const options = q?.quiz_answer_options || []
        const optMap = new Map<string, string>(options.map((o: any) => [o.option_value, o.option_text]))

        const toLabel = (v: string) => optMap.get(v) || v
        const answerText = Array.isArray(val)
          ? (val as any[]).map((x) => toLabel(String(x))).join(', ')
          : toLabel(String(val))

        rows.push({ question: questionText, answer: answerText })
      }

      return rows
    }

    const handleApprove = async () => {
      setIsApproving(true)
      try {
        const res = await fetch(`/api/admin/submissions/${submissionId}/approve`, { method: 'POST' })
        if (!res.ok) {
          const err = await res.json().catch(() => null)
          alert(err?.error || 'Failed to approve')
          return
        }
        // refresh
        const refreshed = await fetch(`/api/admin/submissions/${submissionId}`)
        if (refreshed.ok) {
          const data = await refreshed.json()
          setSubmission(data.submission)
        }
        alert('Approved. You can now send the full evaluation email from the evaluation page.')
      } catch (e) {
        console.error('[v0] Error approving submission:', e)
        alert('Error approving submission')
      } finally {
        setIsApproving(false)
      }
    }

    return (
      <div>
        <div className="mb-6 flex items-center gap-4">
          <Link href="/admin/submissions">
            <Button variant="outline" size="sm">
              ← Back to Submissions
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-foreground">
            {submission.patient_name || participantEmail}
          </h2>
        </div>

        <div className="rounded-lg border border-border bg-card p-8">
          {/* Status */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Status</h3>
            <SectionField
              label="Partial evaluation email sent"
              value={submission.partial_evaluation_sent ? 'Yes' : 'No'}
            />
            <SectionField
              label="Full evaluation approved"
              value={submission.full_evaluation_approved ? 'Yes' : 'No'}
            />
            <SectionField
              label="Approved at"
              value={submission.approved_at ? formatDate(submission.approved_at) : '-'}
            />
          </div>

          {/* Participant */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Participant
            </h3>
            <SectionField label="Name" value={submission.patient_name || '-'} />
            <SectionField label="Email" value={participantEmail} />
            <SectionField
              label="Submitted"
              value={formatDate(submission.submitted_at || submission.created_at)}
            />
          </div>

          {/* Answers */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Answers
            </h3>
            {quizQuestions ? (
              <div className="space-y-3">
                {formatAnswers().map((row, idx) => (
                  <div key={idx} className="rounded-md border border-border bg-background p-4">
                    <div className="text-sm font-semibold text-foreground">{row.question}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{row.answer || '—'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Loading questions…</p>
            )}

            <div className="mt-6">
              <div className="text-sm font-semibold text-foreground mb-2">Raw JSON</div>
            <pre className="whitespace-pre-wrap break-words rounded-md border border-border bg-muted p-4 text-sm text-foreground">
              {JSON.stringify(submission.answers || {}, null, 2)}
            </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Link href={`/admin/evaluations/create?submission=${submission.id}`}>
              <Button size="sm">Create Evaluation</Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              disabled={isApproving || !!submission.full_evaluation_approved}
              onClick={handleApprove}
            >
              {submission.full_evaluation_approved
                ? 'Approved'
                : isApproving
                  ? 'Approving...'
                  : 'Approve Full Evaluation'}
            </Button>
          </div>
        </div>
      </div>
    )
  }
