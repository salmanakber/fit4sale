'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  BarChart2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ArrowRight,
  Loader2,
  Activity,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('de-CH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Helper Component for Score Bars
  const ScoreBar = ({ value, colorClass }: { value: number, colorClass: string }) => (
    <div className="w-24">
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-slate-700">{value ? value : 0}</span>
        <span className="text-slate-400">/100</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", colorClass)} 
          style={{ width: `${value || 0}%` }}
        ></div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
          <p>Auswertungen werden geladen…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-950 flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            Auswertungen
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Übersicht aller erstellten Fitness-Analysen und Berichte.
          </p>
        </div>
        <Link href="/admin/submissions">
          <Button className="bg-blue-900 text-white hover:bg-blue-800 shadow-lg shadow-blue-900/20">
            <Plus className="mr-2 h-4 w-4" />
            Neue Auswertung erstellen
          </Button>
        </Link>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Teilnehmer/in
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Programm
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Fitness Score
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Readiness Score
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Erstellt am
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Aktion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
            {evaluations.length > 0 ? (
    evaluations.map((evaluation) => (
                  <tr 
                    key={evaluation.id} 
                    className="group transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <User className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-slate-900">
                          {evaluation.patient_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {evaluation.recommended_program ? (
                         <span className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs">
                            {evaluation.recommended_program}
                         </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                        <ScoreBar value={evaluation.fitness_level_score} colorClass="bg-emerald-500" />
                    </td>
                    <td className="px-6 py-4">
                        <ScoreBar value={evaluation.readiness_score} colorClass="bg-indigo-500" />
                    </td>
                    <td className="px-6 py-4">
                        {evaluation.evaluation_completed_at ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Fertiggestellt
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                                <Clock className="h-3 w-3" />
                                In Bearbeitung
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(evaluation.evaluation_completed_at || evaluation.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/evaluations/${evaluation.id}`}
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Details
                        <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key="empty">
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                        <div className="mb-3 rounded-full bg-slate-50 p-4">
                            <BarChart2 className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="font-medium text-slate-900">Keine Auswertungen vorhanden</p>
                        <p className="text-sm mt-1">Erstellen Sie die erste Auswertung über das Eingaben-Menü.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
