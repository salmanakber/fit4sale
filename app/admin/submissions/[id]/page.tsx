'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface SubmissionDetail {
  id: string
  patient_name: string
  patient_email: string
  age_group: string
  gender: string
  current_activity_level: string
  health_goals: string
  injuries_conditions: string
  equipment_access: string
  time_available: string
  fitness_experience: string
  motivation: string
  challenges: string
  comments: string
  created_at: string
}

export default function SubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const submissionId = params.id as string
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/admin/submissions/${submissionId}`)
        if (response.ok) {
          const data = await response.json()
          setSubmission(data.submission)
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

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/submissions">
          <Button variant="outline" size="sm">
            ← Back to Submissions
          </Button>
        </Link>
        <h2 className="text-2xl font-bold text-foreground">
          {submission.patient_name}
        </h2>
      </div>

      <div className="rounded-lg border border-border bg-card p-8">
        {/* Personal Information */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Personal Information
          </h3>
          <SectionField label="Name" value={submission.patient_name} />
          <SectionField label="Email" value={submission.patient_email} />
          <SectionField label="Age Group" value={submission.age_group} />
          <SectionField label="Gender" value={submission.gender} />
          <SectionField label="Submitted" value={formatDate(submission.created_at)} />
        </div>

        {/* Fitness Background */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Fitness Background
          </h3>
          <SectionField
            label="Current Activity Level"
            value={submission.current_activity_level}
          />
          <SectionField
            label="Fitness Experience"
            value={submission.fitness_experience}
          />
          <SectionField label="Equipment Access" value={submission.equipment_access} />
          <SectionField
            label="Time Available for Exercise"
            value={submission.time_available}
          />
        </div>

        {/* Health & Goals */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Health & Goals
          </h3>
          <SectionField label="Main Fitness Goals" value={submission.health_goals} />
          <SectionField
            label="Injuries or Health Conditions"
            value={submission.injuries_conditions}
          />
          <SectionField label="Motivation" value={submission.motivation} />
          <SectionField label="Challenges" value={submission.challenges} />
        </div>

        {/* Additional Information */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Additional Information
          </h3>
          <SectionField label="Comments" value={submission.comments} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Link href={`/admin/evaluations/create?submission=${submission.id}`}>
            <Button size="sm">Create Evaluation</Button>
          </Link>
          <Button variant="outline" size="sm">
            Send Email
          </Button>
        </div>
      </div>
    </div>
  )
}
