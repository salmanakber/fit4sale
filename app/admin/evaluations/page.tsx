'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Evaluation {
  id: string
  submission_id: string
  patient_name: string
  recommended_program: string
  fitness_level_score: number
  readiness_score: number
  evaluation_completed_at: string | null
  created_at: string
}

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const response = await fetch('/api/admin/evaluations')
        if (response.ok) {
          const data = await response.json()
          setEvaluations(data.evaluations || [])
        }
      } catch (error) {
        console.error('[v0] Error fetching evaluations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvaluations()
  }, [])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Pending'
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
          <p className="text-muted-foreground">Loading evaluations...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Evaluations</h2>
        <Link href="/admin/submissions">
          <Button size="sm">Create New Evaluation</Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="border-b border-border bg-secondary">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Program
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Fitness Level
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Readiness
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Completed
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {evaluations.length > 0 ? (
              evaluations.map((evaluation) => (
                <tr key={evaluation.id} className="border-b border-border hover:bg-secondary/50">
                  <td className="px-6 py-4 text-sm text-foreground">
                    {evaluation.patient_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {evaluation.recommended_program || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {evaluation.fitness_level_score ? `${evaluation.fitness_level_score}/100` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {evaluation.readiness_score ? `${evaluation.readiness_score}/100` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        evaluation.evaluation_completed_at
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {evaluation.evaluation_completed_at ? 'Completed' : 'In Progress'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(evaluation.evaluation_completed_at)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/admin/evaluations/${evaluation.id}`}
                      className="text-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                  No evaluations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
