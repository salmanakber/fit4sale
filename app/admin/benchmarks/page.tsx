'use client'

import { useState, useEffect } from 'react'
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
  ListFilter,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
}

export default function BenchmarksPage() {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuestion, setSelectedQuestion] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingBenchmark, setEditingBenchmark] = useState<Benchmark | null>(null)
  
  const [formData, setFormData] = useState({
    benchmark_name: '',
    description: '',
    answer_value: '',
    score: 0,
    category: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
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
        // Sort questions by order for better UX
        setQuestions(data.sort((a: Question, b: Question) => a.order_index - b.order_index))
      }
    } catch (error) {
      console.error('[v0] Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBenchmark = async () => {
    if (!selectedQuestion && !formData.benchmark_name) {
      alert('Bitte wählen Sie eine Frage und geben Sie einen Namen ein.')
      return
    }

    try {
      const response = await fetch('/api/admin/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: selectedQuestion || (editingBenchmark?.question_id), // Fallback if needed
          ...formData,
        }),
      })

      if (response.ok) {
        fetchData()
        resetForm()
      } else {
        alert('Fehler beim Erstellen des Benchmarks')
      }
    } catch (error) {
      console.error('[v0] Error:', error)
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
      } else {
        alert('Fehler beim Aktualisieren')
      }
    } catch (error) {
      console.error('[v0] Error:', error)
    }
  }

  const handleDeleteBenchmark = async (id: string) => {
    if (!confirm('Möchten Sie diesen Benchmark wirklich löschen?')) return

    try {
      const response = await fetch(`/api/admin/benchmarks/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('[v0] Error:', error)
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
    // If filtering by question, keep that selection, otherwise set it to the benchmark's question
    if (!selectedQuestion) {
        setSelectedQuestion(benchmark.question_id)
    }
    setFormData({
      benchmark_name: benchmark.benchmark_name,
      description: benchmark.description || '',
      answer_value: benchmark.answer_value,
      score: benchmark.score,
      category: benchmark.category || '',
    })
    setShowForm(true)
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Helper to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-100 text-emerald-700 border-emerald-200"
    if (score >= 50) return "bg-amber-100 text-amber-700 border-amber-200"
    return "bg-rose-100 text-rose-700 border-rose-200"
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col gap-4 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
        <p>Benchmarks werden geladen...</p>
      </div>
    )
  }

  const filteredBenchmarks = selectedQuestion
    ? benchmarks.filter((b) => b.question_id === selectedQuestion)
    : benchmarks

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            Scoring & Benchmarks
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Definieren Sie, wie Antworten bewertet werden (0-100 Punkte).
          </p>
        </div>
        {!showForm && (
            <Button 
                onClick={() => setShowForm(true)} 
                className="bg-blue-900 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20"
            >
                <Plus className="mr-2 h-4 w-4" /> Neuer Benchmark
            </Button>
        )}
      </div>

      {/* Editor Panel (Conditionally rendered) */}
      {showForm && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="rounded-xl border border-blue-200 bg-white shadow-xl shadow-blue-900/5 overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-blue-900 flex items-center gap-2">
                        {editingBenchmark ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {editingBenchmark ? 'Benchmark bearbeiten' : 'Neuen Benchmark erstellen'}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={resetForm} className="h-8 w-8 p-0 text-slate-400 hover:text-red-500">
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                
                <div className="p-6 grid gap-6 md:grid-cols-2">
                    {/* Left Side: Question Context */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-slate-500">Zugehörige Frage</label>
                            <select
                                value={selectedQuestion}
                                onChange={(e) => setSelectedQuestion(e.target.value)}
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                disabled={!!editingBenchmark} // Optional: Lock question on edit to prevent confusion
                            >
                                <option value="">-- Frage auswählen --</option>
                                {questions.map((q) => (
                                <option key={q.id} value={q.id}>
                                    #{q.order_index + 1} {q.question_text.substring(0, 60)}...
                                </option>
                                ))}
                            </select>
                        </div>

                         <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                            <h3 className="text-xs font-bold uppercase text-blue-800 mb-2">Hinweis</h3>
                            <p className="text-xs text-blue-800/80 leading-relaxed">
                                Der "Antwort-Wert" muss exakt mit dem <code>value</code> der Antwortoption übereinstimmen, die im Quiz hinterlegt ist.
                            </p>
                        </div>
                    </div>

                    {/* Right Side: Data Inputs */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-slate-500">Name / Label</label>
                                <Input
                                    value={formData.benchmark_name}
                                    onChange={(e) => setFormData({ ...formData, benchmark_name: e.target.value })}
                                    placeholder="z.B. Anfänger"
                                    className="bg-slate-50 border-slate-200"
                                />
                            </div>
                             <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-slate-500">Kategorie (Optional)</label>
                                <Input
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="z.B. Ausdauer"
                                    className="bg-slate-50 border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-slate-500">Antwort-Wert (Technisch)</label>
                            <Input
                                value={formData.answer_value}
                                onChange={(e) => setFormData({ ...formData, answer_value: e.target.value })}
                                placeholder="Value aus der Frage"
                                className="font-mono text-sm bg-slate-50 border-slate-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-slate-500">Score (0-100)</label>
                             <div className="flex items-center gap-4">
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.score}
                                    onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) })}
                                    className="w-24 bg-slate-50 border-slate-200 font-bold text-blue-900"
                                />
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={formData.score} 
                                    onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) })}
                                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                             </div>
                        </div>

                         <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-slate-500">Beschreibung (Intern)</label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Notizen..."
                                rows={2}
                                className="resize-none bg-slate-50 border-slate-200"
                            />
                        </div>

                        <div className="pt-2 flex gap-3">
                            <Button onClick={editingBenchmark ? handleUpdateBenchmark : handleAddBenchmark} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                <Save className="mr-2 h-4 w-4" /> Speichern
                            </Button>
                            <Button variant="outline" onClick={resetForm} className="flex-1">
                                Abbrechen
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-4">
         <div className="flex items-center gap-2 text-slate-500 min-w-[100px]">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filter:</span>
         </div>
         <div className="relative flex-1">
             <select
                value={selectedQuestion}
                onChange={(e) => setSelectedQuestion(e.target.value)}
                className="w-full appearance-none rounded-md bg-slate-50 border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
                <option value="">Alle Benchmarks anzeigen</option>
                {questions.map((q) => (
                    <option key={q.id} value={q.id}>
                    Frage {q.order_index + 1}: {q.question_text.substring(0, 80)}...
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <ListFilter className="h-4 w-4" />
            </div>
         </div>
      </div>

      {/* Benchmarks List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Frage Kontext
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Antwort & Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Kategorie
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Score
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBenchmarks.length > 0 ? (
                  filteredBenchmarks.map((benchmark) => {
                    const question = questions.find((q) => q.id === benchmark.question_id)
                    return (
                      <tr key={benchmark.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex flex-col gap-1 max-w-xs">
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 w-fit px-1.5 py-0.5 rounded">
                                    Frage {question ? question.order_index + 1 : '?'}
                                </span>
                                <span className="text-sm text-slate-600 line-clamp-2" title={question?.question_text}>
                                    {question?.question_text || 'Frage gelöscht'}
                                </span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-900">{benchmark.benchmark_name}</span>
                                <span className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-1">
                                   <ArrowRight className="h-3 w-3" /> {benchmark.answer_value}
                                </span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                            {benchmark.category ? (
                                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                    {benchmark.category}
                                </span>
                            ) : (
                                <span className="text-slate-300">-</span>
                            )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold",
                              getScoreColor(benchmark.score)
                          )}>
                             {benchmark.score}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEdit(benchmark)}
                                    className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteBenchmark(benchmark.id)}
                                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
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
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                            <Search className="h-8 w-8 mb-2 text-slate-200" />
                            <p>Keine Benchmarks gefunden.</p>
                            {selectedQuestion && <p className="text-sm">Für diese Frage wurden noch keine Werte definiert.</p>}
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