'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, 
  Save, 
  Wand2, 
  User, 
  FileText, 
  Plus, 
  Trash2, 
  Loader2,
  List,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Placeholder for logic import
// import { calculateEvaluationScore } from '@/lib/evaluation-logic'

interface SubmissionData {
  id: string
  patient_name: string | null
  patient_email: string | null
  participant_email: string | null
  answers?: any
  created_at?: string
}

const Loading = () => (
    <div className="flex h-[50vh] items-center justify-center flex-col gap-4 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
        <p>Daten werden geladen...</p>
    </div>
)

function CreateEvaluationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const submissionId = useMemo(() => searchParams.get('submission') || '', [searchParams])

  const [submission, setSubmission] = useState<SubmissionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showAutoScoreInfo, setShowAutoScoreInfo] = useState(false)
  const [autoCategoryScores, setAutoCategoryScores] = useState<Record<string, number> | null>(
    null
  )
  const [scoreCategoryA, setScoreCategoryA] = useState<string>('')
  const [scoreCategoryB, setScoreCategoryB] = useState<string>('')

  const [customFields, setCustomFields] = useState<Array<{ label: string; value: string }>>([
    { label: 'Zusammenfassung', value: '' },
  ])

  const [evaluation, setEvaluation] = useState({
    fitnesLevelScore: '',
    readinessScore: '',
    recommendedProgram: '',
    safetyConserns: '',
    personalisedRecommendations: '',
    programDuration: '',
    intensityLevel: '',
    specialModifications: '',
  })

  useEffect(() => {
    if (!submissionId) {
      setIsLoading(false)
      return
    }

    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/admin/submissions/${submissionId}`)
        if (response.ok) {
          const data = await response.json()
          setSubmission(data.submission)
        } else {
            // Error handling or redirect
        }
      } catch (error) {
        console.error('[v0] Error fetching submission:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubmission()
  }, [submissionId])

  // Auto-fill using benchmark-based scoring cache (evaluation_results_cache)
  const handleAutoScore = async () => {
    if (!submissionId) return
    setShowAutoScoreInfo(true)
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/evaluation-cache`)
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        alert(err?.error || 'Keine automatische Auswertung gefunden')
        return
      }

      const data = await res.json()
      const cache = data?.cache

      const totalScore = cache?.total_score ?? 0
      const byCategory = cache?.section_scores?.byCategory as Record<string, number> | undefined
      const recommendation = cache?.recommendations as string | undefined

      const catEntries = byCategory ? Object.entries(byCategory) : []
      const preferredOrder = [
        'Lead-Generierung',
        'Bedarfsanalyse',
        'Angebot',
        'Einwandbehandlung',
        'Abschluss',
        'Follow-up',
      ]
      const orderedCats =
        catEntries.length > 0
          ? [
              ...preferredOrder.filter((c) => byCategory && c in byCategory),
              ...catEntries.map(([k]) => k).filter((k) => !preferredOrder.includes(k)),
            ]
          : []

      setAutoCategoryScores(byCategory || null)

      // Default category mapping for the two score boxes (admin can override via dropdowns)
      const nextCatA = orderedCats[0] || ''
      const nextCatB = orderedCats[1] || ''
      setScoreCategoryA(nextCatA)
      setScoreCategoryB(nextCatB)

      const scoreA = (nextCatA && byCategory?.[nextCatA]) ?? totalScore
      const scoreB = (nextCatB && byCategory?.[nextCatB]) ?? totalScore

      // Build a short German summary from categories + recommendation
      const categorySummary =
        catEntries.length > 0
          ? `Teilbereiche: ${catEntries
              .slice(0, 4)
              .map(([k, v]) => `${k} ${v}/100`)
              .join(' · ')}`
          : ''

      setEvaluation((prev) => ({
        ...prev,
        fitnesLevelScore: String(scoreA),
        readinessScore: String(scoreB),
        recommendedProgram: recommendation ? `Score: ${totalScore}/100` : `Score: ${totalScore}/100`,
        intensityLevel: nextCatA || prev.intensityLevel,
        programDuration: prev.programDuration || '',
        personalisedRecommendations: [recommendation, categorySummary].filter(Boolean).join(' | '),
      }))
    } catch (e) {
      console.error('[v0] Auto-Berechnung failed:', e)
      alert('Auto-Berechnung fehlgeschlagen')
    }
  }

  // Keep the two numeric score fields in sync when admin changes the selected categories
  useEffect(() => {
    if (!autoCategoryScores) return
    if (scoreCategoryA && scoreCategoryA in autoCategoryScores) {
      setEvaluation((prev) => ({
        ...prev,
        fitnesLevelScore: String(autoCategoryScores[scoreCategoryA]),
      }))
    }
  }, [autoCategoryScores, scoreCategoryA])

  useEffect(() => {
    if (!autoCategoryScores) return
    if (scoreCategoryB && scoreCategoryB in autoCategoryScores) {
      setEvaluation((prev) => ({
        ...prev,
        readinessScore: String(autoCategoryScores[scoreCategoryB]),
      }))
    }
  }, [autoCategoryScores, scoreCategoryB])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/admin/evaluations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          fitnessLevelScore: parseInt(evaluation.fitnesLevelScore) || 0,
          readinessScore: parseInt(evaluation.readinessScore) || 0,
          recommendedProgram: evaluation.recommendedProgram,
          safetyConcerns: evaluation.safetyConserns,
          personalizedRecommendations: evaluation.personalisedRecommendations,
          programDuration: evaluation.programDuration,
          intensityLevel: evaluation.intensityLevel,
          specialModifications: evaluation.specialModifications,
          customFields,
        }),
      })

      if (response.ok) {
        router.push('/admin/evaluations')
      } else {
        alert('Failed to save evaluation')
      }
    } catch (error) {
      console.error('[v0] Error saving evaluation:', error)
      alert('Error saving evaluation')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <Loading />

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
            <Link 
              href="/admin/submissions"
              className="group rounded-full bg-white p-2 text-slate-500 shadow-sm border border-slate-200 transition-colors hover:border-blue-200 hover:text-blue-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-blue-950">Auswertung erstellen</h1>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <User className="h-3 w-3" />
                    <span>{submission?.patient_name || 'Unbekannter Teilnehmer'}</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3">
             <Button 
                type="button" 
                variant="outline" 
                onClick={handleAutoScore}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
             >
                <Wand2 className="mr-2 h-4 w-4" />
                Auto-Berechnung
             </Button>
             <Button 
                onClick={handleSubmit} 
                disabled={isSaving}
                className="bg-blue-900 text-white hover:bg-blue-800 shadow-lg shadow-blue-900/20"
             >
                {isSaving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Speichern...</>
                ) : (
                    <><Save className="mr-2 h-4 w-4" /> Speichern & Abschließen</>
                )}
             </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* LEFT COLUMN: Reference Data (Sticky) */}
        <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-6 space-y-6">
                
                {/* Participant Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500 flex items-center gap-2">
                        <User className="h-4 w-4" /> Teilnehmer Daten
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div>
                            <span className="block text-xs text-slate-400">Name</span>
                            <span className="font-medium text-slate-800">{submission?.patient_name || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-slate-400">Email</span>
                            <span className="font-medium text-slate-800 break-all">{submission?.patient_email || submission?.participant_email || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Answers Reference */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col max-h-[600px]">
                    <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 flex items-center gap-2">
                            <List className="h-4 w-4" /> Gegebene Antworten
                        </h3>
                    </div>
                    <div className="overflow-y-auto p-0">
                        {submission?.answers ? (
                             <div className="text-xs">
                                <pre className="whitespace-pre-wrap p-4 font-mono text-slate-600 bg-slate-50/50">
                                    {JSON.stringify(submission.answers, null, 2)}
                                </pre>
                                {/* Note: In a real app, you would map over questions here to show them nicely */}
                             </div>
                        ) : (
                            <div className="p-5 text-center text-sm text-slate-400">Keine Antworten verfügbar</div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Evaluation Form */}
        <div className="lg:col-span-2 space-y-6">
             
             {!submissionId && (
                <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-red-700">
                    <p className="font-medium">Fehler: Keine Submission-ID gefunden.</p>
                </div>
             )}

            {showAutoScoreInfo && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-indigo-800 flex items-start gap-3">
                    <Wand2 className="h-5 w-5 mt-0.5 text-indigo-600" />
                    <div>
                        <p className="font-semibold text-sm">Werte automatisch vorgeschlagen</p>
                        <p className="text-sm opacity-90">Basierend auf den Antworten wurden Scores und Empfehlungen vorläufig ausgefüllt. Bitte überprüfen Sie diese.</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Scores Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-6 text-sm font-bold uppercase tracking-wide text-blue-950 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Scoring
                    </h3>
                    {autoCategoryScores && Object.keys(autoCategoryScores).length > 0 && (
                      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
                          Kategorie-Zuordnung für Score A / B
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-slate-600">Score A Kategorie</Label>
                            <select
                              value={scoreCategoryA}
                              onChange={(e) => setScoreCategoryA(e.target.value)}
                              className="h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">(Total Score)</option>
                              {Object.keys(autoCategoryScores).map((k) => (
                                <option key={k} value={k}>
                                  {k}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-600">Score B Kategorie</Label>
                            <select
                              value={scoreCategoryB}
                              onChange={(e) => setScoreCategoryB(e.target.value)}
                              className="h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">(Total Score)</option>
                              {Object.keys(autoCategoryScores).map((k) => (
                                <option key={k} value={k}>
                                  {k}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="fitness" className="text-slate-600">Score A (0-100)</Label>
                            <div className="relative">
                                <Input
                                    id="fitness"
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="h-12 text-lg font-semibold text-blue-900 border-slate-200 focus-visible:ring-blue-500"
                                    value={evaluation.fitnesLevelScore}
                                    onChange={(e) => setEvaluation(prev => ({ ...prev, fitnesLevelScore: e.target.value }))}
                                    required
                                />
                                <span className="absolute right-4 top-3 text-slate-400 font-medium">/ 100</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="readiness" className="text-slate-600">Score B (0-100)</Label>
                            <div className="relative">
                                <Input
                                    id="readiness"
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="h-12 text-lg font-semibold text-indigo-900 border-slate-200 focus-visible:ring-indigo-500"
                                    value={evaluation.readinessScore}
                                    onChange={(e) => setEvaluation(prev => ({ ...prev, readinessScore: e.target.value }))}
                                    required
                                />
                                <span className="absolute right-4 top-3 text-slate-400 font-medium">/ 100</span>
                            </div>
                        </div>
                    </div>

                    {autoCategoryScores && Object.keys(autoCategoryScores).length > 0 && (
                      <div className="mt-6">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
                          Teilbereiche (Benchmark)
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                          {Object.entries(autoCategoryScores).map(([k, v]) => (
                            <div
                              key={k}
                              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            >
                              <span className="text-slate-700">{k}</span>
                              <span className="font-semibold text-slate-900">{v}/100</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Main Content Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-blue-950 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Analyse & Programm
                    </h3>

                    <div className="grid gap-6 md:grid-cols-2">
                         <div className="space-y-2">
                            <Label htmlFor="program">Empfohlenes Programm</Label>
                            <Input
                                id="program"
                                placeholder="z.B. Ganzkörper Kraftaufbau"
                                value={evaluation.recommendedProgram}
                                onChange={(e) => setEvaluation(prev => ({ ...prev, recommendedProgram: e.target.value }))}
                                className="bg-slate-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="intensity">Intensität / Level</Label>
                            <Input
                                id="intensity"
                                placeholder="z.B. Fortgeschritten"
                                value={evaluation.intensityLevel}
                                onChange={(e) => setEvaluation(prev => ({ ...prev, intensityLevel: e.target.value }))}
                                className="bg-slate-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Dauer / Zeithorizont</Label>
                            <Input
                                id="duration"
                                placeholder="z.B. 12 Wochen"
                                value={evaluation.programDuration}
                                onChange={(e) => setEvaluation(prev => ({ ...prev, programDuration: e.target.value }))}
                                className="bg-slate-50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                         <Label htmlFor="safety">Sicherheitsbedenken / Risiken</Label>
                         <Textarea
                            id="safety"
                            placeholder="Gibt es gesundheitliche Einschränkungen?"
                            value={evaluation.safetyConserns}
                            onChange={(e) => setEvaluation(prev => ({ ...prev, safetyConserns: e.target.value }))}
                            className="bg-slate-50 min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-2">
                         <Label htmlFor="recommendations">Detaillierte Empfehlungen</Label>
                         <Textarea
                            id="recommendations"
                            placeholder="Schreiben Sie hier Ihre ausführliche Analyse..."
                            value={evaluation.personalisedRecommendations}
                            onChange={(e) => setEvaluation(prev => ({ ...prev, personalisedRecommendations: e.target.value }))}
                            className="bg-slate-50 min-h-[120px]"
                        />
                    </div>

                     <div className="space-y-2">
                         <Label htmlFor="modifications">Spezielle Modifikationen (Notizen)</Label>
                         <Textarea
                            id="modifications"
                            placeholder="Interne Notizen oder spezielle Anpassungen..."
                            value={evaluation.specialModifications}
                            onChange={(e) => setEvaluation(prev => ({ ...prev, specialModifications: e.target.value }))}
                            className="bg-slate-50 min-h-[80px]"
                        />
                    </div>
                </div>

                {/* Custom Fields Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                         <h3 className="text-sm font-bold uppercase tracking-wide text-blue-950">
                            Zusätzliche Datenfelder
                        </h3>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8"
                            onClick={() => setCustomFields((prev) => [...prev, { label: '', value: '' }])}
                        >
                            <Plus className="mr-1 h-3 w-3" /> Feld hinzufügen
                        </Button>
                    </div>
                    
                    <div className="space-y-3">
                        {customFields.map((f, idx) => (
                            <div key={idx} className="flex gap-3 items-start group">
                                <div className="flex-1">
                                    <Input
                                        value={f.label}
                                        onChange={(e) => setCustomFields((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))}
                                        placeholder="Label (z.B. BMI)"
                                        className="bg-slate-50 text-xs font-semibold uppercase text-slate-500"
                                    />
                                </div>
                                <div className="flex-[2]">
                                    <Input
                                        value={f.value}
                                        onChange={(e) => setCustomFields((prev) => prev.map((x, i) => (i === idx ? { ...x, value: e.target.value } : x)))}
                                        placeholder="Wert eingeben"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => setCustomFields((prev) => prev.filter((_, i) => i !== idx))}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {customFields.length === 0 && (
                            <p className="text-sm text-slate-400 italic text-center py-2">Keine zusätzlichen Felder definiert.</p>
                        )}
                    </div>
                </div>

            </form>
        </div>
      </div>
    </div>
  )
}

export default function CreateEvaluationPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CreateEvaluationContent />
    </Suspense>
  )
}