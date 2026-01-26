'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, 
  Search, 
  Target, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Filter, 
  Loader2,
  Check,
  ChevronDown,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Types ---
interface Benchmark {
  id: string
  question_id: string
  benchmark_name: string
  description: string
  answer_value: string
  score: number
  category: string
  created_at: string
}

interface Question {
  id: string
  question_text: string
  question_type: string
  order_index: number
  quiz_answer_options?: Array<{
    id: string
    option_text: string
    option_value: string
    order_index: number
  }>
}

// --- Custom Components ---

// A High-Quality Custom Select Component to replace the default HTML select
const CustomSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select...", 
  disabled = false 
}: { 
  options: { label: string, value: string, subLabel?: string }[], 
  value: string, 
  onChange: (val: string) => void,
  placeholder?: string,
  disabled?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(o => o.value === value)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (opt.subLabel && opt.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex min-h-[42px] w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm shadow-sm transition-all duration-200",
          disabled ? "cursor-not-allowed opacity-50 bg-slate-100" : "bg-white hover:border-blue-400",
          isOpen ? "border-blue-600 ring-2 ring-blue-600/10" : "border-slate-200",
          !selectedOption && "text-slate-500"
        )}
      >
        <span className="truncate pr-2">
          {selectedOption ? (
            <span className="flex flex-col text-left">
              <span className="font-medium text-slate-700">{selectedOption.subLabel}</span>
              <span className="text-xs text-slate-500 truncate">{selectedOption.label}</span>
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-[300px] w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="sticky top-0 border-b border-slate-100 bg-slate-50 p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Suche..."
                className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-2 text-xs outline-none focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[220px] py-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">Keine Ergebnisse</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center px-3 py-2.5 text-sm outline-none transition-colors hover:bg-blue-50",
                    option.value === value && "bg-blue-50/50"
                  )}
                >
                  <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
                    {option.subLabel && (
                        <span className="font-semibold text-xs text-blue-900/80 uppercase tracking-wide">
                            {option.subLabel}
                        </span>
                    )}
                    <span className={cn("truncate", option.value === value ? "font-medium text-blue-700" : "text-slate-600")}>
                      {option.label}
                    </span>
                  </div>
                  {option.value === value && <Check className="ml-2 h-4 w-4 text-blue-600" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}


// --- Main Page Component ---

export default function BenchmarksPage() {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingBenchmark, setEditingBenchmark] = useState<Benchmark | null>(null)
  
  const [formData, setFormData] = useState({
    benchmark_name: '',
    description: '',
    answer_value: '',
    score: 0,
    category: '',
  })

  // Get selected question details
  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId)
  const isTextareaQuestion = selectedQuestion?.question_type === 'textarea'
  const answerOptions = selectedQuestion?.quiz_answer_options || []

  // Format questions for the custom dropdown
  const questionOptions = questions.map(q => ({
    value: q.id,
    label: q.question_text,
    subLabel: `Frage #${q.order_index + 1}`
  }))

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Mocking fetch for visual demonstration purposes if needed
      // Replace these with your actual API calls
      const [benchmarksRes, questionsRes] = await Promise.all([
        fetch('/api/admin/benchmarks'),
        fetch('/api/admin/quiz/questions'),
      ])

      if (benchmarksRes.ok) {
        const data = await benchmarksRes.json()
        setBenchmarks(data)
      }

      if (questionsRes.ok) {
        const data = await questionsRes.json()
        // Sort questions and ensure answer options are included
        setQuestions(data.sort((a: Question, b: Question) => a.order_index - b.order_index))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBenchmark = async () => {
    if (!selectedQuestionId && !formData.benchmark_name) {
      alert('Bitte wählen Sie eine Frage und geben Sie einen Namen ein.')
      return
    }

    try {
      const response = await fetch('/api/admin/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: selectedQuestionId || (editingBenchmark?.question_id), 
          ...formData,
        }),
      })

      if (response.ok) {
        fetchData()
        resetForm()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleUpdateBenchmark = async () => {
    if (!editingBenchmark) return

    try {
      const response = await fetch(`/api/admin/benchmarks/${editingBenchmark.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchData()
        resetForm()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDeleteBenchmark = async (id: string) => {
    if (!confirm('Möchten Sie diesen Benchmark wirklich löschen?')) return
    try {
      const response = await fetch(`/api/admin/benchmarks/${id}`, { method: 'DELETE' })
      if (response.ok) fetchData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const resetForm = () => {
    setEditingBenchmark(null)
    setFormData({
      benchmark_name: '',
      description: '',
      answer_value: '',
      score: 0,
      category: '',
    })
    setShowForm(false)
  }

  const startEdit = (benchmark: Benchmark) => {
    setEditingBenchmark(benchmark)
    if (!selectedQuestionId) {
        setSelectedQuestionId(benchmark.question_id)
    }
    setFormData({
      benchmark_name: benchmark.benchmark_name,
      description: benchmark.description || '',
      answer_value: benchmark.answer_value,
      score: benchmark.score,
      category: benchmark.category || '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Reset answer_value when question changes
  useEffect(() => {
    if (selectedQuestionId && !editingBenchmark) {
      setFormData((prev) => ({ ...prev, answer_value: '' }))
    }
  }, [selectedQuestionId, editingBenchmark])

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20"
    if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20"
    return "bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20"
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-900" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Lade Benchmarks...</p>
      </div>
    )
  }

  const filteredBenchmarks = selectedQuestionId
    ? benchmarks.filter((b) => b.question_id === selectedQuestionId)
    : benchmarks

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 pt-8">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-950 flex items-center gap-3">
              <div className="p-2 bg-blue-950 rounded-lg shadow-lg shadow-blue-900/20">
                <Target className="h-6 w-6 text-white" />
              </div>
              Scoring Benchmarks
            </h1>
            <p className="mt-2 text-base text-slate-500 max-w-2xl">
              Verwalten Sie die Bewertungslogik Ihres Quiz. Definieren Sie Scores (0-100) basierend auf spezifischen Antworten.
            </p>
          </div>
          {!showForm && (
              <Button 
                  onClick={() => setShowForm(true)} 
                  className="bg-blue-950 hover:bg-blue-900 text-white h-12 px-6 rounded-lg shadow-xl shadow-blue-950/10 transition-all hover:-translate-y-0.5"
              >
                  <Plus className="mr-2 h-5 w-5" /> Neuer Benchmark
              </Button>
          )}
        </div>

        {/* --- Form Section (Collapsible) --- */}
        {showForm && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
              <div className="rounded-2xl border border-blue-100 bg-white shadow-2xl shadow-blue-900/5 overflow-hidden ring-1 ring-blue-900/5">
                  <div className="bg-blue-950 px-8 py-4 flex justify-between items-center">
                      <h2 className="text-sm font-bold uppercase tracking-wider text-blue-100 flex items-center gap-2">
                          {editingBenchmark ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                          {editingBenchmark ? 'Eintrag bearbeiten' : 'Neuen Eintrag erstellen'}
                      </h2>
                      <Button variant="ghost" size="sm" onClick={resetForm} className="h-8 w-8 p-0 text-blue-300 hover:text-white hover:bg-white/10 rounded-full">
                          <X className="h-5 w-5" />
                      </Button>
                  </div>
                  
                  <div className="p-8 grid gap-10 md:grid-cols-12">
                      {/* Left Column: Context */}
                      <div className="md:col-span-5 space-y-6">
                          <div className="space-y-3">
                              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Zugehörige Frage auswählen</label>
                              <CustomSelect 
                                options={questionOptions}
                                value={selectedQuestionId}
                                onChange={setSelectedQuestionId}
                                placeholder="Bitte Frage wählen..."
                                disabled={!!editingBenchmark}
                              />
                          </div>

                           <div className="rounded-xl bg-blue-50/80 p-5 border border-blue-100 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Target className="h-24 w-24 text-blue-900"/>
                              </div>
                              <h3 className="text-sm font-bold text-blue-900 mb-2 relative z-10">Wichtiger Hinweis</h3>
                              <p className="text-sm text-blue-800/80 leading-relaxed relative z-10">
                                  {selectedQuestionId ? (
                                    isTextareaQuestion ? (
                                      <>Für <strong>Text-Fragen</strong> geben Sie den erwarteten Text-Wert manuell ein.</>
                                    ) : (
                                      <>Für <strong>Radio/Checkbox-Fragen</strong> wählen Sie die Antwort-Option aus dem Dropdown. Der technische Wert wird automatisch übernommen.</>
                                    )
                                  ) : (
                                    <>Wählen Sie zuerst eine Frage aus, um die verfügbaren Antwort-Optionen zu sehen.</>
                                  )}
                              </p>
                          </div>
                      </div>

                      {/* Right Column: Inputs */}
                      <div className="md:col-span-7 space-y-6">
                          <div className="grid grid-cols-2 gap-5">
                              <div className="space-y-2">
                                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Label (Anzeige)</label>
                                  <Input
                                      value={formData.benchmark_name}
                                      onChange={(e) => setFormData({ ...formData, benchmark_name: e.target.value })}
                                      placeholder="z.B. Fortgeschritten"
                                      className="border-slate-200 focus-visible:ring-blue-950 h-10"
                                  />
                              </div>
                               <div className="space-y-2">
                                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Kategorie (Optional)</label>
                                  <Input
                                      value={formData.category}
                                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                      placeholder="z.B. Technik"
                                      className="border-slate-200 focus-visible:ring-blue-950 h-10"
                                  />
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Antwort-Wert {isTextareaQuestion ? '(Text-Eingabe)' : '(Aus Optionen wählen)'}
                              </label>
                              {isTextareaQuestion ? (
                                <Input
                                    value={formData.answer_value}
                                    onChange={(e) => setFormData({ ...formData, answer_value: e.target.value })}
                                    placeholder="Geben Sie den Text-Wert ein..."
                                    className="border-slate-200 focus-visible:ring-blue-950 h-10"
                                />
                              ) : answerOptions.length > 0 ? (
                                <CustomSelect
                                    options={answerOptions
                                      .sort((a, b) => a.order_index - b.order_index)
                                      .map((opt) => ({
                                        value: opt.option_value,
                                        label: opt.option_text,
                                        subLabel: `Wert: ${opt.option_value}`
                                      }))}
                                    value={formData.answer_value}
                                    onChange={(val) => setFormData({ ...formData, answer_value: val })}
                                    placeholder="Antwort-Option auswählen..."
                                    disabled={!selectedQuestionId}
                                />
                              ) : (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                  <p className="font-medium mb-1">Keine Antwort-Optionen verfügbar</p>
                                  <p className="text-xs">Diese Frage hat noch keine Antwort-Optionen. Bitte fügen Sie zuerst Optionen im Quiz-Editor hinzu.</p>
                                </div>
                              )}
                              {!isTextareaQuestion && answerOptions.length > 0 && formData.answer_value && (
                                <p className="text-xs text-slate-500 mt-1">
                                  Ausgewählter Wert: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">{formData.answer_value}</code>
                                </p>
                              )}
                          </div>

                          <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Score Punkte</label>
                                <span className="text-xl font-bold text-blue-950">{formData.score} <span className="text-sm text-slate-400 font-normal">/ 100</span></span>
                              </div>
                              <input 
                                  type="range" 
                                  min="0" 
                                  max="100" 
                                  value={formData.score} 
                                  onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) })}
                                  className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-950 hover:accent-blue-800 transition-all"
                              />
                          </div>

                           <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Interne Notiz</label>
                              <Textarea
                                  value={formData.description}
                                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                  placeholder="Beschreibung für interne Zwecke..."
                                  rows={2}
                                  className="resize-none border-slate-200 focus-visible:ring-blue-950"
                              />
                          </div>

                          <div className="pt-4 flex gap-4">
                              <Button onClick={editingBenchmark ? handleUpdateBenchmark : handleAddBenchmark} className="flex-1 bg-blue-950 hover:bg-blue-900 text-white h-11">
                                  <Save className="mr-2 h-4 w-4" /> Speichern
                              </Button>
                              <Button variant="outline" onClick={resetForm} className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50 h-11">
                                  Abbrechen
                              </Button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        )}

        {/* --- List View --- */}
        <div className="space-y-4">
          
          {/* Filter Toolbar */}
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-2 text-blue-950/70 min-w-[80px]">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-semibold">Filter:</span>
             </div>
             <div className="flex-1 max-w-lg">
                <CustomSelect 
                    options={[{ label: "Alle Benchmarks anzeigen", value: "" }, ...questionOptions]}
                    value={selectedQuestionId}
                    onChange={setSelectedQuestionId}
                    placeholder="Nach Frage filtern..."
                />
             </div>
             <div className="ml-auto text-sm text-slate-400">
                {filteredBenchmarks.length} Einträge
             </div>
          </div>

          {/* Table Card */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-950/60 w-1/3">
                      Frage Kontext
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-950/60">
                      Antwort Logik
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-950/60">
                      Kategorie
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-950/60">
                      Score
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-blue-950/60">
                      Optionen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBenchmarks.length > 0 ? (
                      filteredBenchmarks.map((benchmark) => {
                        const question = questions.find((q) => q.id === benchmark.question_id)
                        return (
                          <tr key={benchmark.id} className="group hover:bg-blue-50/30 transition-colors duration-200">
                            <td className="px-6 py-5 align-top">
                               <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-full border border-blue-100">
                                        Frage {question ? question.order_index + 1 : '?'}
                                    </span>
                                    <span className="text-sm font-medium text-slate-700 leading-snug line-clamp-2" title={question?.question_text}>
                                        {question?.question_text || 'Frage gelöscht'}
                                    </span>
                               </div>
                            </td>
                            <td className="px-6 py-5 align-top">
                               <div className="flex flex-col gap-1">
                                    <span className="text-sm font-bold text-slate-900">{benchmark.benchmark_name}</span>
                                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-slate-50 w-fit px-1.5 rounded">
                                       <span className="text-slate-300">val:</span> 
                                       {benchmark.answer_value}
                                    </div>
                               </div>
                            </td>
                            <td className="px-6 py-5 align-top">
                                {benchmark.category ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                        {benchmark.category}
                                    </span>
                                ) : (
                                    <span className="text-slate-300 text-xs">-</span>
                                )}
                            </td>
                            <td className="px-6 py-5 align-top">
                              <span className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ring-1 ring-inset",
                                  getScoreColor(benchmark.score)
                              )}>
                                 {benchmark.score} <span className="text-[10px] opacity-70 font-normal">pts</span>
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right align-middle">
                               <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => startEdit(benchmark)}
                                        className="h-9 w-9 p-0 rounded-full text-slate-400 hover:text-blue-700 hover:bg-blue-100"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteBenchmark(benchmark.id)}
                                        className="h-9 w-9 p-0 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                               </div>
                            </td>
                          </tr>
                        )
                      })
                  ) : (
                    <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                <div className="bg-slate-50 p-4 rounded-full mb-3">
                                  <Search className="h-6 w-6 text-slate-300" />
                                </div>
                                <h3 className="text-slate-900 font-semibold mb-1">Keine Benchmarks gefunden</h3>
                                <p className="text-slate-500 text-sm mb-6">
                                  {selectedQuestionId 
                                    ? "Für diese Frage wurden noch keine Bewertungskriterien definiert." 
                                    : "Erstellen Sie den ersten Benchmark, um zu starten."}
                                </p>
                                <Button variant="outline" onClick={() => setShowForm(true)} className="border-dashed border-slate-300">
                                  Benchmark erstellen
                                </Button>
                            </div>
                        </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
