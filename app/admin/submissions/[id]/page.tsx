'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Calendar, 
  Mail, 
  User, 
  CheckCircle2, 
  FileText, 
  Clock, 
  ShieldCheck,
  FileJson,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
    return new Date(dateString).toLocaleDateString('de-CH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
      const refreshed = await fetch(`/api/admin/submissions/${submissionId}`)
      if (refreshed.ok) {
        const data = await refreshed.json()
        setSubmission(data.submission)
      }
      alert('Freigegeben. Sie können jetzt die vollständige Auswertung per E-Mail senden.')
    } catch (e) {
      console.error('[v0] Error approving submission:', e)
      alert('Error approving submission')
    } finally {
      setIsApproving(false)
    }
  }

  const participantEmail = submission?.patient_email || submission?.participant_email || '-'

  const formatAnswers = () => {
    const answers = submission?.answers || {}
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

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
          <p className="text-sm text-slate-500">Details werden geladen...</p>
        </div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-red-50 p-3 text-red-500">
           <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Eingabe konnte nicht geladen werden</h2>
        <p className="text-slate-500 mb-6">{loadError || 'Unbekannter Fehler'}</p>
        <Link href="/admin/submissions">
          <Button variant="outline">Zurück zur Übersicht</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Navigation & Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/submissions" className="rounded-full bg-white p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors shadow-sm border border-slate-200">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
             <h1 className="text-2xl font-bold text-blue-950">
               {submission.patient_name || 'Unbekannter Teilnehmer'}
             </h1>
             <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{submission.id.substring(0,8)}...</span>
                <span>•</span>
                <span>{participantEmail}</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <Link href={`/admin/evaluations/create?submission=${submission.id}`}>
              <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <FileText className="mr-2 h-4 w-4" />
                Auswertung erstellen
              </Button>
            </Link>
            <Button
              onClick={handleApprove}
              disabled={isApproving || !!submission.full_evaluation_approved}
              className={cn(
                "min-w-[140px]",
                submission.full_evaluation_approved 
                   ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                   : "bg-blue-900 hover:bg-blue-800 text-white"
              )}
            >
              {submission.full_evaluation_approved ? (
                <>
                   <CheckCircle2 className="mr-2 h-4 w-4" />
                   Freigegeben
                </>
              ) : isApproving ? (
                <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Wird verarbeitet...
                </>
              ) : (
                <>
                   <ShieldCheck className="mr-2 h-4 w-4" />
                   Freigeben
                </>
              )}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Left Column: Details & Status */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Info Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Details</h3>
            
            <div className="space-y-4">
               <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-blue-50 p-2 text-blue-600">
                     <User className="h-4 w-4" />
                  </div>
                  <div>
                     <p className="text-sm font-medium text-slate-900">Name</p>
                     <p className="text-sm text-slate-500">{submission.patient_name || '-'}</p>
                  </div>
               </div>

               <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-blue-50 p-2 text-blue-600">
                     <Mail className="h-4 w-4" />
                  </div>
                  <div>
                     <p className="text-sm font-medium text-slate-900">Email</p>
                     <p className="text-sm text-slate-500 break-all">{participantEmail}</p>
                  </div>
               </div>

               <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-blue-50 p-2 text-blue-600">
                     <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                     <p className="text-sm font-medium text-slate-900">Eingereicht am</p>
                     <p className="text-sm text-slate-500">
                        {formatDate(submission.submitted_at || submission.created_at)}
                     </p>
                  </div>
               </div>
            </div>
          </div>

          {/* Status Timeline Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Status Verlauf</h3>
            
            <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-2">
               {/* Step 1 */}
               <div className="relative pl-6">
                  <span className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white bg-blue-600 ring-4 ring-blue-50"></span>
                  <p className="text-sm font-medium text-slate-900">Eingabe erhalten</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDate(submission.created_at)}
                  </p>
               </div>

               {/* Step 2 */}
               <div className="relative pl-6">
                  <span className={cn(
                      "absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white",
                      submission.partial_evaluation_sent ? "bg-blue-600 ring-4 ring-blue-50" : "bg-slate-300"
                  )}></span>
                  <p className={cn("text-sm font-medium", submission.partial_evaluation_sent ? "text-slate-900" : "text-slate-400")}>
                    Vorläufige Auswertung
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {submission.partial_evaluation_sent ? 'Per E-Mail versendet' : 'Noch ausstehend'}
                  </p>
               </div>

               {/* Step 3 */}
               <div className="relative pl-6">
                  <span className={cn(
                      "absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white",
                      submission.full_evaluation_approved ? "bg-emerald-500 ring-4 ring-emerald-50" : "bg-slate-300"
                  )}></span>
                  <p className={cn("text-sm font-medium", submission.full_evaluation_approved ? "text-emerald-700" : "text-slate-400")}>
                     Vollständige Freigabe
                  </p>
                  {submission.approved_at && (
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(submission.approved_at)}
                    </p>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quiz Answers */}
        <div className="lg:col-span-2 space-y-6">
           <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
             <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
                <h3 className="font-semibold text-blue-950 flex items-center gap-2">
                   <FileText className="h-4 w-4 text-blue-600" />
                   Quiz Antworten
                </h3>
                {quizQuestions && (
                    <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                        {formatAnswers().length} Fragen
                    </span>
                )}
             </div>
             
             <div className="divide-y divide-slate-100">
                {quizQuestions ? (
                    formatAnswers().map((row, idx) => (
                        <div key={idx} className="group px-6 py-4 transition-colors hover:bg-slate-50">
                            <p className="text-sm font-semibold text-slate-700 mb-1">
                                {row.question}
                            </p>
                            <p className="text-sm text-slate-600 bg-slate-50/50 p-2 rounded-md border border-slate-100 group-hover:bg-white group-hover:border-blue-100 transition-colors">
                                {row.answer || <span className="text-slate-400 italic">Keine Antwort</span>}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-300" />
                        Fragen werden geladen...
                    </div>
                )}
             </div>
           </div>

           {/* Raw Data Accordion (Optional but professional) */}
           <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <details className="group">
                  <summary className="flex cursor-pointer items-center text-sm font-medium text-slate-500 hover:text-blue-600">
                      <FileJson className="mr-2 h-4 w-4" />
                      Technische Rohdaten anzeigen
                  </summary>
                  <div className="mt-4">
                    <pre className="max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white p-4 text-xs font-mono text-slate-600 shadow-inner">
                        {JSON.stringify(submission.answers || {}, null, 2)}
                    </pre>
                  </div>
              </details>
           </div>
        </div>

      </div>
    </div>
  )
}
