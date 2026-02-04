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
  TrendingUp, // Sales icon
  Briefcase,  // Business icon
  AlertOctagon, // Risk icon
  FileBadge,
  ShieldCheck,
  Loader2,
  Calendar,
  BarChart3,
  Target,
  Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Types ---
interface EvaluationDetail {
  id: string
  submission_id: string
  fitness_level_score: number // Mapped to: Sales Performance
  readiness_score: number // Mapped to: Closing Potential
  recommended_program: string // Mapped to: Strategy
  safety_concerns: string // Mapped to: Blockers
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

// --- Premium Components ---

const KpiCard = ({ value, label, subLabel, icon: Icon, trendColor }: { value: number, label: string, subLabel: string, icon: any, trendColor: string }) => (
  <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-200 transition-all hover:shadow-md">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-slate-900">{value}</span>
          <span className="text-sm font-medium text-slate-400">/ 100</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">{subLabel}</p>
      </div>
      <div className={cn("rounded-lg p-3 bg-opacity-10", trendColor.replace('text-', 'bg-'))}>
        <Icon className={cn("h-6 w-6", trendColor)} />
      </div>
    </div>
    {/* Progress Bar styled as a target meter */}
    <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100">
      <div
        className={cn("h-full rounded-full transition-all duration-1000", trendColor.replace('text-', 'bg-'))}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
)

const StrategyItem = ({ label, value, icon: Icon }: { label: string, value: string, icon: any }) => (
  <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100">
    <div className="mt-1 text-slate-400">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-0.5">{value || 'Nicht definiert'}</p>
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
      if (response.ok) alert('Report wurde erfolgreich gesendet.')
      else {
        const err = await response.json().catch(() => null)
        alert(err?.error || 'Fehler beim Senden')
      }
    } catch (error) {
      alert('Fehler beim Senden')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleApprove = async () => {
    if (!evaluation) return
    setIsApproving(true)
    try {
      const res = await fetch(`/api/admin/submissions/${evaluation.submission_id}/approve`, { method: 'POST' })
      if (!res.ok) {
        alert('Fehler bei der Freigabe')
        return
      }
      const refreshed = await fetch(`/api/admin/evaluations/${evaluationId}`)
      if (refreshed.ok) {
        const data = await refreshed.json()
        setEvaluation(data.evaluation)
      }
    } catch (e) {
      alert('Fehler bei der Freigabe')
    } finally {
      setIsApproving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-4 text-slate-500">
        <Loader2 className="h-10 w-10 animate-spin text-slate-800" />
        <p className="text-sm font-medium uppercase tracking-wide">Lade Analyse...</p>
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
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">

      {/* --- Premium Header --- */}
      <div className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <Link href="/admin/evaluations" className="mt-1 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                    {participantName}
                  </h1>
                  {isApproved ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Freigegeben
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Ausstehend
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  {evaluation.quiz_submissions.patient_email || evaluation.quiz_submissions.participant_email || 'Keine Email'}
                  <span className="text-slate-600">|</span>
                  <Calendar className="h-3 w-3" />
                  {new Date(evaluation.evaluation_completed_at).toLocaleDateString('de-DE')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleApprove}
                disabled={isApproving || isApproved}
                className={cn(
                  "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors border",
                  isApproved && "border-emerald-900 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/30"
                )}
              >
                {isApproved ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                {isApproved ? "Status: OK" : "Bericht Freigeben"}
              </Button>

              <Button
                onClick={handleSendEmail}
                disabled={isSendingEmail || !isApproved}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-900/20 border-none"
              >
                {isSendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                An Kunden Senden
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Dashboard Content --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8">

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <KpiCard
            label="Vertriebs-Performance"
            subLabel="Gesamtanalyse Status Quo"
            value={evaluation.fitness_level_score}
            icon={BarChart3}
            trendColor="text-blue-600"
          />
          <KpiCard
            label="Abschluss-Potenzial"
            subLabel="Bereitschaft & Mindset"
            value={evaluation.readiness_score}
            icon={TrendingUp}
            trendColor="text-emerald-500"
          />

          {/* Summary Card (Visual) */}
          <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg flex flex-col justify-between border border-slate-700">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Empfohlene Strategie</p>
              <h3 className="text-xl font-bold leading-tight text-white mb-1">
                {evaluation.recommended_program}
              </h3>
              <p className="text-sm text-slate-400">{evaluation.program_duration}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
              <span className="text-xs text-slate-400">Intensität</span>
              <span className="text-xs font-bold px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                {evaluation.intensity_level}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: Detailed Report (2/3) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Benchmark Chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Benchmark Analyse</h3>
                  <p className="text-sm text-slate-500">Vergleich zum Marktdurchschnitt</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                  <Target className="h-5 w-5" />
                </div>
              </div>
              <BenchmarkReportChart submissionId={evaluation.submission_id} />
            </div>

            {/* Strategy Grid */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Strategische Planung
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <StrategyItem label="Coaching Fokus" value={evaluation.recommended_program} icon={Target} />
                <StrategyItem label="Laufzeit" value={evaluation.program_duration} icon={Clock} />
                <StrategyItem label="Level" value={evaluation.intensity_level} icon={BarChart3} />
                <StrategyItem label="Anmerkungen" value={evaluation.special_modifications} icon={FileBadge} />
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" /> Handlungsempfehlungen
                </h3>
              </div>
              <div className="p-6">
                {recommendationsList.length > 0 ? (
                  <div className="space-y-4">
                    {recommendationsList.map((rec, idx) => (
                      <div key={idx} className="flex gap-4 items-start group">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {idx + 1}
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pt-1.5">{rec.trim()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Keine Daten verfügbar.</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Risks & Meta (1/3) */}
          <div className="lg:col-span-1 space-y-6">

            {/* Risk Box - High Visibility */}
            {evaluation.safety_concerns && (
              <div className="rounded-xl border border-red-100 bg-white shadow-sm overflow-hidden">
                <div className="bg-red-50/50 px-5 py-3 border-b border-red-100 flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 text-red-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wide text-red-900">
                    Wachstums-Blockaden
                  </h3>
                </div>
                <div className="p-5">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {evaluation.safety_concerns}
                  </p>
                </div>
              </div>
            )}

            {/* CRM Data Card */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-4">
                Kontakt Details
              </h4>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{participantName}</p>
                  <p className="text-xs text-slate-500">Lead / Interessent</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Email Adresse</p>
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {evaluation.quiz_submissions.patient_email || evaluation.quiz_submissions.participant_email || '-'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Erstellt am</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(evaluation.evaluation_completed_at).toLocaleDateString('de-DE')}
                  </p>
                </div>

                {evaluation.quiz_submissions.approved_at && (
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Freigabe am</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(evaluation.quiz_submissions.approved_at).toLocaleDateString('de-DE')}
                    </p>
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