'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BenchmarkReportChart } from '@/components/benchmark-report-chart'
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  User,
  Mail,
  Clock,
  Activity,
  Zap,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Loader2,
  CalendarDays,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Types ---
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

// --- Sub-Components (Defined outside for performance) ---

const ScoreCard = ({ score, label, icon: Icon, colorClass, subText }: { score: number; label: string, icon: any, colorClass: string, subText?: string }) => (
  <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300">
    <div className="flex items-start justify-between mb-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-slate-500 mb-1">
          <div className={cn("p-1.5 rounded-md bg-slate-50", colorClass.replace('bg-', 'text-'))}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        </div>
        {subText && <p className="text-xs text-slate-400 pl-1">{subText}</p>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{score}</span>
        <span className="text-sm font-medium text-slate-400">/100</span>
      </div>
    </div>
    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-1000 ease-out", colorClass)}
        style={{ width: `${score}%` }}
      ></div>
    </div>
  </div>
)

const DetailRow = ({ label, value, icon: Icon }: { label: string, value: string, icon: any }) => (
  <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
    <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white border border-slate-100 text-slate-500 shadow-sm">
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-medium text-slate-900 leading-snug mt-0.5">{value || '-'}</p>
    </div>
  </div>
)

export default function EvaluationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const evaluationId = (params as any)?.id as string | undefined
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  useEffect(() => {
    if (!evaluationId || evaluationId === 'undefined') {
      setIsLoading(false)
      router.push('/admin/evaluations')
      return
    }

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
        alert('Email sent successfully')
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
      const refreshed = await fetch(`/api/admin/evaluations/${evaluationId}`)
      if (refreshed.ok) {
        const data = await refreshed.json()
        setEvaluation(data.evaluation)
      }
    } catch (e) {
      console.error('[v0] Error approving:', e)
      alert('Error approving')
    } finally {
      setIsApproving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-4 text-slate-500">
        <Loader2 className="h-10 w-10 animate-spin text-blue-900/50" />
        <p className="text-sm font-medium animate-pulse">Bericht wird geladen...</p>
      </div>
    )
  }

  if (!evaluation) return null

  const recommendationsList = evaluation.personalized_recommendations
    ? evaluation.personalized_recommendations.split(' | ').filter((rec) => rec.trim().length > 0)
    : []

  const isApproved = !!evaluation.quiz_submissions.full_evaluation_approved
  const participantName = evaluation.quiz_submissions.patient_name

  return (
    <div className="min-h-screen bg-slate-50/30 pb-20">
      <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6">

        {/* Header Actions */}
        <div className="flex flex-col gap-6 pt-8 pb-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-5">
            <Link href="/admin/evaluations" className="group mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm border border-slate-200 transition-all hover:border-blue-200 hover:text-blue-600 hover:shadow-md">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {participantName}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  <Activity className="h-3 w-3" /> Fitness Report
                </span>
                <span>•</span>
                <span>ID: {evaluation.submission_id.slice(0, 8)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleApprove}
              disabled={isApproving || isApproved}
              className={cn(
                "h-10 border shadow-sm transition-all",
                isApproved
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              )}
            >
              {isApproved ? (
                <><CheckCircle2 className="mr-2 h-4 w-4" /> Freigegeben</>
              ) : isApproving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verarbeite...</>
              ) : (
                <><ShieldCheck className="mr-2 h-4 w-4" /> Freigeben</>
              )}
            </Button>

            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail || !isApproved}
              className={cn(
                "h-10 shadow-md transition-all",
                isApproved
                  ? "bg-blue-900 hover:bg-blue-800 text-white shadow-blue-900/20"
                  : "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
              )}
            >
              {isSendingEmail ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sende...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Email Senden</>
              )}
            </Button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">

          {/* LEFT COLUMN: Main Report Content (8/12) */}
          <div className="lg:col-span-8 space-y-8">

            {/* Scores Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ScoreCard
                score={evaluation.fitness_level_score}
                label="Fitness Level"
                subText="Gesamtbewertung"
                icon={Target}
                colorClass="bg-emerald-500"
              />
              <ScoreCard
                score={evaluation.readiness_score}
                label="Readiness"
                subText="Trainingsbereitschaft"
                icon={Zap}
                colorClass="bg-indigo-500"
              />
            </div>

            {/* Safety Concerns (High Priority) */}
            {evaluation.safety_concerns && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-amber-100 p-2 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-amber-900">
                      Wichtige Hinweise & Risiken
                    </h3>
                    <p className="mt-1 text-sm text-amber-800 leading-relaxed">
                      {evaluation.safety_concerns}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Program Details Card */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <FileText className="h-4 w-4 text-blue-600" /> Programm Übersicht
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <DetailRow label="Empfohlenes Programm" value={evaluation.recommended_program} icon={Activity} />
                  <DetailRow label="Intensität" value={evaluation.intensity_level} icon={Zap} />
                  <DetailRow label="Dauer / Frequenz" value={evaluation.program_duration} icon={Clock} />
                  <DetailRow label="Besondere Modifikationen" value={evaluation.special_modifications} icon={FileText} />
                </div>
              </div>
            </div>

            {/* Benchmark Report Chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <Activity className="h-4 w-4 text-blue-600" /> Benchmark Analyse
                </h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Visualisierung</span>
              </div>
              <BenchmarkReportChart submissionId={evaluation.submission_id} />
            </div>

            {/* Recommendations List */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Personalisierte Empfehlungen
                </h3>
              </div>
              <div className="p-6">
                {recommendationsList.length > 0 ? (
                  <ul className="space-y-4">
                    {recommendationsList.map((rec, idx) => (
                      <li key={idx} className="flex gap-4">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-xs font-bold mt-0.5 shadow-sm">
                          {idx + 1}
                        </div>
                        <div className="text-sm text-slate-600 leading-relaxed pt-0.5">{rec.trim()}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic text-sm">Keine spezifischen Empfehlungen vorhanden.</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar (Sticky) (4/12) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">

            {/* Participant Info */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Teilnehmer
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900">{evaluation.quiz_submissions.patient_name}</p>
                    <p className="text-xs text-slate-500">Patient / Teilnehmer</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate max-w-[200px]" title={evaluation.quiz_submissions.patient_email || ''}>
                      {evaluation.quiz_submissions.patient_email || evaluation.quiz_submissions.participant_email || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Status & Metadaten
                </h3>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Aktueller Status</span>
                  {isApproved ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Freigegeben
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-md text-xs">
                      <Clock className="h-3.5 w-3.5" /> Ausstehend
                    </span>
                  )}
                </div>

                <div className="border-t border-slate-100 my-2"></div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-slate-400"><CalendarDays className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Erstellt am</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(evaluation.evaluation_completed_at).toLocaleDateString('de-CH', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(evaluation.evaluation_completed_at).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })} Uhr
                    </p>
                  </div>
                </div>

                {evaluation.quiz_submissions.approved_at && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-emerald-500"><ShieldCheck className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Freigabe am</p>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(evaluation.quiz_submissions.approved_at).toLocaleString('de-CH')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}