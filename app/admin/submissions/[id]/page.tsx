'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Calendar, 
  Mail, 
  CheckCircle2, 
  FileText, 
  ShieldCheck,
  FileJson,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  LayoutGrid
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
  const [copiedEmail, setCopiedEmail] = useState(false)

  // Fetch Submission
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

    if (submissionId) fetchSubmission()
  }, [submissionId, router])

  // Fetch Quiz Structure
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

  // Utility: Date Formatter
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Utility: Copy Email
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  // Action: Approve
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
    } catch (e) {
      console.error('[v0] Error approving submission:', e)
      alert('Error approving submission')
    } finally {
      setIsApproving(false)
    }
  }

  // Helper: Get Initials
  const getInitials = (name: string | null) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  // --- NEW: Grouped Answers Logic ---
  const getGroupedAnswers = () => {
    const answers = submission?.answers || {}
    if (!quizQuestions) return null

    const qMap = new Map<string, any>(quizQuestions.map((q) => [q.id, q]))
    
    // Structure: { "Category Name": [ { question: "Text", answer: "Value" } ] }
    const grouped: Record<string, Array<{ question: string; answer: string }>> = {}
    let totalQuestions = 0

    for (const [qid, val] of Object.entries(answers)) {
      if (qid === 'participant_email') continue
      
      const q = qMap.get(qid)
      
      // SKIP if we can't find the question definition (Removes raw IDs)
      if (!q || !q.question_text) continue 

      const category = q.category || 'Allgemein'
      const questionText = q.question_text
      const options = q.quiz_answer_options || []
      const optMap = new Map<string, string>(options.map((o: any) => [o.option_value, o.option_text]))

      const toLabel = (v: string) => optMap.get(v) || v
      const answerText = Array.isArray(val)
        ? (val as any[]).map((x) => toLabel(String(x))).join(', ')
        : toLabel(String(val))

      if (!grouped[category]) {
        grouped[category] = []
      }
      
      grouped[category].push({ question: questionText, answer: answerText })
      totalQuestions++
    }

    return { grouped, totalQuestions }
  }

  const participantEmail = submission?.patient_email || submission?.participant_email || '-'
  const participantName = submission?.patient_name || 'Unbekannter Teilnehmer'
  const answerData = getGroupedAnswers()

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Lade Details...</p>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-red-50 p-4 text-red-500 ring-4 ring-red-50/50">
           <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Fehler beim Laden</h2>
        <p className="mt-2 text-slate-500 mb-8 max-w-md">{loadError || 'Daten nicht gefunden.'}</p>
        <Link href="/admin/submissions">
          <Button variant="outline">Zurück</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8 lg:p-10">
      
      {/* HEADER */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Link 
            href="/admin/submissions" 
            className="group mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-600"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          </Link>
          <div>
             <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  {participantName}
                </h1>
                {submission.full_evaluation_approved && (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Freigegeben
                  </span>
                )}
             </div>
             <p className="mt-1 text-sm text-slate-500">
               ID: <span className="font-mono text-slate-400">{submission.id}</span>
             </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            <Link href={`/admin/evaluations/create?submission=${submission.id}`}>
              <Button variant="outline" className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700">
                <FileText className="mr-2 h-4 w-4" />
                Auswertung
              </Button>
            </Link>
            
            <Button
              onClick={handleApprove}
              disabled={isApproving || !!submission.full_evaluation_approved}
              className={cn(
                "min-w-[150px] shadow-sm",
                submission.full_evaluation_approved 
                   ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-default" 
                   : "bg-blue-900 hover:bg-blue-800 text-white"
              )}
            >
              {submission.full_evaluation_approved ? (
                <><CheckCircle2 className="mr-2 h-4 w-4" /> Freigegeben</>
              ) : isApproving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verarbeite...</>
              ) : (
                <><ShieldCheck className="mr-2 h-4 w-4" /> Freigeben</>
              )}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* LEFT SIDEBAR (Meta Info) */}
        <div className="space-y-6 lg:col-span-4 xl:col-span-3">
          {/* User Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Profil</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-600">
                  {getInitials(participantName)}
                </div>
                <h3 className="font-semibold text-slate-900">{participantName}</h3>
              </div>
              
              <div className="space-y-3">
                 <div className="rounded-lg border border-slate-100 p-3 bg-slate-50/50">
                    <p className="text-xs text-slate-400 mb-1">E-Mail</p>
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium text-slate-800" title={participantEmail}>{participantEmail}</p>
                      <button onClick={() => copyToClipboard(participantEmail)} className="text-slate-400 hover:text-blue-600">
                        {copiedEmail ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                 </div>
                 <div className="rounded-lg border border-slate-100 p-3 bg-slate-50/50">
                    <p className="text-xs text-slate-400 mb-1">Datum</p>
                    <p className="text-sm font-medium text-slate-800">{formatDate(submission.submitted_at || submission.created_at)}</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT (Answers) */}
        <div className="space-y-6 lg:col-span-8 xl:col-span-9">
           
           <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
             <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-slate-900">Antworten</h2>
                </div>
                {answerData && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {answerData.totalQuestions} Fragen
                  </span>
                )}
             </div>
             
             <div className="p-6 md:p-8 bg-slate-50/30 rounded-b-2xl">
                {answerData && answerData.grouped ? (
                    <div className="space-y-10">
                      {Object.entries(answerData.grouped).map(([category, items], catIdx) => (
                        <div key={catIdx} className="relative">
                          {/* Category Header */}
                          <div className="sticky top-0 z-10 mb-4 bg-slate-50/95 py-2 backdrop-blur-sm">
                            <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-blue-900/80">
                              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                              {category}
                            </h3>
                          </div>

                          {/* Questions Grid */}
                          <div className="grid gap-4 md:grid-cols-1">
                            {items.map((row, idx) => (
                              <div 
                                key={idx} 
                                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 transition-colors group-hover:bg-blue-500"></div>
                                
                                <div className="ml-2">
                                  {/* Question Label */}
                                  <h4 className="mb-2 text-sm font-medium text-slate-500">
                                    {row.question}
                                  </h4>
                                  
                                  {/* Answer Value */}
                                  <div className="relative rounded-lg bg-slate-50 px-4 py-3 text-slate-900">
                                     <p className="font-semibold text-base">
                                       {row.answer || <span className="italic text-slate-400">Keine Antwort</span>}
                                     </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                        <span className="mt-2 text-sm">Fragen werden geladen...</span>
                    </div>
                )}
             </div>
           </div>

           {/* Raw Data Toggle */}
           <div className="flex justify-end">
              <details className="group text-right">
                  <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors select-none">
                      <FileJson className="h-3 w-3" />
                      <span>Rohdaten anzeigen</span>
                  </summary>
                  <div className="mt-2 w-full max-w-2xl text-left">
                    <pre className="overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-[10px] font-mono text-slate-500 shadow-inner max-h-40">
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
