'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  BarChart2, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ArrowRight,
  Loader2,
  Activity,
  Dumbbell
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

  // --- Helpers ---

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('de-CH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  // --- Components ---

  const ScoreBar = ({ value, colorClass, label }: { value: number, colorClass: string, label?: string }) => (
    <div className="w-32">
      <div className="mb-1.5 flex justify-between items-end">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <div className="flex items-baseline gap-0.5">
            <span className="text-sm font-bold text-slate-700">{value ? value : 0}</span>
            <span className="text-[10px] text-slate-400">/100</span>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", colorClass)} 
          style={{ width: `${value || 0}%` }}
        ></div>
      </div>
    </div>
  )

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Auswertungen werden geladen...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-700" />
            Auswertungen
          </h2>
          <p className="text-sm text-slate-500">
            Übersicht aller generierten Fitness-Analysen und Programm-Empfehlungen.
          </p>
        </div>
        
        <Button 
            asChild
            className="bg-blue-900 text-white hover:bg-blue-800 shadow-md shadow-blue-900/10 transition-all hover:-translate-y-0.5"
        >
            <Link href="/admin/submissions">
                <Plus className="mr-2 h-4 w-4" />
                Neue Auswertung
            </Link>
        </Button>
      </div>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="bg-slate-50/75 text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Teilnehmer/in</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Empfohlenes Programm</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Fitness Score</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Readiness Score</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Erstellt am</th>
                <th className="px-6 py-4 text-right font-semibold uppercase tracking-wider text-xs">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {evaluations.length > 0 ? (
                evaluations.map((evaluation) => (
                  <tr 
                    key={evaluation.id} 
                    className="group transition-colors hover:bg-slate-50/60"
                  >
                    {/* Participant */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 ring-2 ring-white shadow-sm">
                            {getInitials(evaluation.patient_name)}
                        </div>
                        <span className="font-medium text-slate-900">
                          {evaluation.patient_name}
                        </span>
                      </div>
                    </td>

                    {/* Program */}
                    <td className="px-6 py-4">
                      {evaluation.recommended_program ? (
                         <div className="flex items-center gap-2">
                             <div className="rounded-md bg-blue-50 p-1 text-blue-600">
                                 <Dumbbell className="h-3.5 w-3.5" />
                             </div>
                             <span className="font-medium text-slate-700">
                                {evaluation.recommended_program}
                             </span>
                         </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Ausstehend</span>
                      )}
                    </td>

                    {/* Fitness Score */}
                    <td className="px-6 py-4">
                        <ScoreBar 
                            value={evaluation.fitness_level_score} 
                            colorClass="bg-emerald-500" 
                            label="Fitness"
                        />
                    </td>

                    {/* Readiness Score */}
                    <td className="px-6 py-4">
                        <ScoreBar 
                            value={evaluation.readiness_score} 
                            colorClass="bg-indigo-500" 
                            label="Readiness"
                        />
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                        {evaluation.evaluation_completed_at ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Fertiggestellt
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                <Clock className="h-3 w-3" />
                                In Bearbeitung
                            </span>
                        )}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(evaluation.evaluation_completed_at || evaluation.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <Button 
                        asChild 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Link href={`/admin/evaluations/${evaluation.id}`}>
                            Details
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                /* Empty State */
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                        <div className="mb-4 rounded-full bg-slate-50 p-4 ring-1 ring-slate-100">
                            <BarChart2 className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="mb-1 text-base font-semibold text-slate-900">Keine Auswertungen vorhanden</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Erstellen Sie die erste Auswertung über das Eingaben-Menü.
                        </p>
                        <Button asChild variant="outline" size="sm">
                             <Link href="/admin/submissions">Zu den Eingaben</Link>
                        </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        {evaluations.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <p className="text-xs font-medium text-slate-500">
                    Gesamt: {evaluations.length} Reports
                </p>
            </div>
        )}
      </div>
    </div>
  )
}
