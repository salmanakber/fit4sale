'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Submission {
  id: string
  patient_name: string
  patient_email: string | null
  participant_email: string | null
  partial_evaluation_sent?: boolean | null
  full_evaluation_pending?: boolean | null
  full_evaluation_approved?: boolean | null
  created_at: string
  submitted_at?: string | null
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch('/api/admin/submissions')
        if (response.ok) {
          const data = await response.json()
          setSubmissions(data.submissions || [])
          setFilteredSubmissions(data.submissions || [])
        }
      } catch (error) {
        console.error('[v0] Error fetching submissions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubmissions()
  }, [])

  useEffect(() => {
    const filtered = submissions.filter(
      (submission) =>
        submission.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (submission.patient_email || submission.participant_email || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    )
    setFilteredSubmissions(filtered)
  }, [searchQuery, submissions])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Survey Submissions</h2>
        <div className="text-sm text-muted-foreground">
          Total: {filteredSubmissions.length}
        </div>
      </div>

      <div className="mb-6">
        <Input
          type="search"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="border-b border-border bg-secondary">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Patient Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Email
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Partial Email
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Full Approved
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.length > 0 ? (
              filteredSubmissions.map((submission) => (
                <tr key={submission.id} className="border-b border-border hover:bg-secondary/50">
                  <td className="px-6 py-4 text-sm text-foreground">
                    {submission.patient_name || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {submission.patient_email || submission.participant_email || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {submission.partial_evaluation_sent ? 'Sent' : 'Not sent'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {submission.full_evaluation_approved ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(submission.submitted_at || submission.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/admin/submissions/${submission.id}`}
                      className="text-primary hover:underline"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  No submissions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
