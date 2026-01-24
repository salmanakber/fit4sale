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

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/admin/submissions/${submissionId}`)
        if (response.ok) {
          const data = await response.json()
          setSubmission(data.submission)
        } else {
        console.log(response.json())
          // router.push('/admin/submissions')
        }
      } catch (error) {
        console.error('[v0] Error fetching submission:', error)
        // router.push('/admin/submissions')
      } finally {
        setIsLoading(false)
      }
    }

    if (submissionId) {
      fetchSubmission()
    }
  }, [submissionId, router])

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
    return null
  }

  const participantEmail = submission.patient_email || submission.participant_email || '-'

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
            Answers (raw)
          </h3>
          <pre className="whitespace-pre-wrap break-words rounded-md border border-border bg-muted p-4 text-sm text-foreground">
            {JSON.stringify(submission.answers || {}, null, 2)}
          </pre>
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
