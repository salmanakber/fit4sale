'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  User, 
  Mail, 
  Calendar, 
  Activity, 
  Zap, 
  Clock, 
  AlertTriangle, 
  FileText,
  ShieldCheck,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

  const ScoreCard = ({ score, label, icon: Icon, colorClass }: { score: number; label: string, icon: any, colorClass: string }) => (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-500">
             <div className={cn("p-2 rounded-lg bg-slate-50", colorClass.replace('bg-', 'text-'))}>
                <Icon className="h-5 w-5" />
             </div>
             <span className="text-sm font-bold uppercase tracking-wide">{label}</span>
          </div>
          <span className="text-3xl font-bold text-slate-900">{score}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", colorClass)}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  )

  const InfoItem = ({ label, value, icon: Icon }: { label: string, value: string, icon: any }) => (
    <div className="flex items-start gap-3">
        <div className="mt-0.5 text-slate-400">
            <Icon className="h-4 w-4" />
        </div>
        <div>
            <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
            <p className="font-medium text-slate-900">{value || '-'}</p>
        </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col gap-4 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
        <p>Bericht wird geladen...</p>
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
    <div className="space-y-6 pb-12">
      
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/evaluations" className="group rounded-full bg-white p-2 text-slate-500 shadow-sm border border-slate-200 transition-colors hover:border-blue-200 hover:text-blue-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-blue-950">
                {participantName}
            </h1>
            <p className="text-sm text-slate-500">Fitness-Analyse & Bericht</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleApprove}
            disabled={isApproving || isApproved}
            className={cn(
                "border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-colors",
                isApproved ? "text-emerald-700 bg-emerald-50 border-emerald-200 opacity-100" : "text-slate-600"
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
            className="bg-blue-900 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20"
            title={!isApproved ? 'Bitte zuerst freigeben' : undefined}
            size="sm"
          >
             {isSendingEmail ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sende Email...</>
             ) : (
                <><Send className="mr-2 h-4 w-4" /> Email an Kunden</>
             )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: Main Report Content */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Scores Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ScoreCard 
                    score={evaluation.fitness_level_score} 
                    label="Fitness Score" 
                    icon={Activity}
                    colorClass="bg-emerald-500" 
                />
                <ScoreCard 
                    score={evaluation.readiness_score} 
                    label="Readiness Score" 
                    icon={Zap}
                    colorClass="bg-indigo-500" 
                />
            </div>

            {/* Program Details Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-sm font-bold uppercase tracking-wide text-blue-950 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <FileText className="h-4 w-4" /> Programm Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoItem label="Empfohlenes Programm" value={evaluation.recommended_program} icon={Activity} />
                    <InfoItem label="Intensität" value={evaluation.intensity_level} icon={Zap} />
                    <InfoItem label="Dauer" value={evaluation.program_duration} icon={Clock} />
                    <InfoItem label="Besondere Hinweise" value={evaluation.special_modifications} icon={FileText} />
                </div>
            </div>

             {/* Safety Concerns (Only if present) */}
             {evaluation.safety_concerns && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-800 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Risiken & Blocker
                    </h3>
                    <p className="text-sm text-amber-900/80">
                        {evaluation.safety_concerns}
                    </p>
                </div>
            )}

            {/* Recommendations List */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-sm font-bold uppercase tracking-wide text-blue-950 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Empfehlungen
                </h3>
                
                {recommendationsList.length > 0 ? (
                    <ul className="space-y-4">
                    {recommendationsList.map((rec, idx) => (
                        <li key={idx} className="flex gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">
                                {idx + 1}
                            </div>
                            <div className="text-sm text-slate-700 leading-relaxed">{rec.trim()}</div>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-slate-400 italic">Keine spezifischen Empfehlungen vorhanden.</p>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Meta Data */}
        <div className="space-y-6">
            
            {/* Participant Info */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Teilnehmer Daten
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-900">{evaluation.quiz_submissions.patient_name}</p>
                            <p className="text-xs text-slate-500">Teilnehmer</p>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                        <div className="flex items-start gap-3">
                            <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                            <p className="text-sm text-slate-600 break-all">
                                {evaluation.quiz_submissions.patient_email || evaluation.quiz_submissions.participant_email || '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status Information
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Freigabe Status</span>
                        {isApproved ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded text-xs">
                                <CheckCircle2 className="h-3 w-3" /> Freigegeben
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded text-xs">
                                <Clock className="h-3 w-3" /> Ausstehend
                            </span>
                        )}
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Erstellt am</span>
                        <span className="text-slate-900 font-medium">
                            {new Date(evaluation.evaluation_completed_at).toLocaleDateString('de-CH')}
                        </span>
                    </div>

                    {evaluation.quiz_submissions.approved_at && (
                        <div className="pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400">
                                Freigegeben am {new Date(evaluation.quiz_submissions.approved_at).toLocaleString('de-CH')}
                            </p>
                        </div>
                    )}
                </div>
            </div>

        </div>

        {/* Scores */}
        <div className="grid gap-6 md:grid-cols-2">
          <ScoreDisplay score={evaluation.fitness_level_score} label="Score A" />
          <ScoreDisplay score={evaluation.readiness_score} label="Score B" />
        </div>

        {/* Details */}
        <div className="rounded-lg border border-border bg-card p-8">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Details</h3>
          <SectionField label="Summary" value={evaluation.recommended_program} />
          <SectionField label="Category" value={evaluation.intensity_level} />
          <SectionField label="Timeline" value={evaluation.program_duration} />
          <SectionField label="Notes" value={evaluation.special_modifications} />
          <SectionField label="Risks / Blockers" value={evaluation.safety_concerns} />
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

        {/* Participant Info */}
        <div className="rounded-lg border border-border bg-card p-8">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Participant Information</h3>
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
            label="Report Created"
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
