'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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
        setQuestions(data)
      }
    } catch (error) {
      console.error('[v0] Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBenchmark = async () => {
    if (!selectedQuestion || !formData.benchmark_name || !formData.answer_value) {
      alert('Bitte füllen Sie alle erforderlichen Felder aus')
      return
    }

    try {
      const response = await fetch('/api/admin/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: selectedQuestion,
          ...formData,
        }),
      })

      if (response.ok) {
        fetchData()
        setFormData({
          benchmark_name: '',
          description: '',
          answer_value: '',
          score: 0,
          category: '',
        })
        setShowForm(false)
        alert('Benchmark erfolgreich erstellt')
      } else {
        alert('Fehler beim Erstellen des Benchmarks')
      }
    } catch (error) {
      console.error('[v0] Error:', error)
      alert('Fehler beim Erstellen des Benchmarks')
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
        setEditingBenchmark(null)
        setFormData({
          benchmark_name: '',
          description: '',
          answer_value: '',
          score: 0,
          category: '',
        })
        setShowForm(false)
        alert('Benchmark erfolgreich aktualisiert')
      } else {
        alert('Fehler beim Aktualisieren des Benchmarks')
      }
    } catch (error) {
      console.error('[v0] Error:', error)
      alert('Fehler beim Aktualisieren des Benchmarks')
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
        alert('Benchmark erfolgreich gelöscht')
      } else {
        alert('Fehler beim Löschen des Benchmarks')
      }
    } catch (error) {
      console.error('[v0] Error:', error)
      alert('Fehler beim Löschen des Benchmarks')
    }
  }

  if (loading) {
    return <div className="text-center text-foreground">Wird geladen...</div>
  }

  const filteredBenchmarks = selectedQuestion
    ? benchmarks.filter((b) => b.question_id === selectedQuestion)
    : benchmarks

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Benchmark-Verwaltung</h1>
        <Button onClick={() => setShowForm(true)}>+ Neuer Benchmark</Button>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Nach Frage filtern</h2>
        <select
          value={selectedQuestion}
          onChange={(e) => setSelectedQuestion(e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Alle Fragen anzeigen</option>
          {questions.map((q) => (
            <option key={q.id} value={q.id}>
              Frage {q.order_index + 1}: {q.question_text.substring(0, 50)}...
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {editingBenchmark ? 'Benchmark bearbeiten' : 'Neuer Benchmark'}
          </h2>

          {!editingBenchmark && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">Frage *</label>
              <select
                value={selectedQuestion}
                onChange={(e) => setSelectedQuestion(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Wählen Sie eine Frage</option>
                {questions.map((q) => (
                  <option key={q.id} value={q.id}>
                    Frage {q.order_index + 1}: {q.question_text.substring(0, 50)}...
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Benchmark-Name *
              </label>
              <Input
                value={formData.benchmark_name}
                onChange={(e) => setFormData({ ...formData, benchmark_name: e.target.value })}
                placeholder="z.B. Anfänger, Fortgeschrittener"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Beschreibung
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optionale Beschreibung"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Antwort-Wert *
              </label>
              <Input
                value={formData.answer_value}
                onChange={(e) => setFormData({ ...formData, answer_value: e.target.value })}
                placeholder="Der Antwort-Wert aus der Frage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Punktzahl (0-100) *
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) })}
                placeholder="0-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Kategorie</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Optional: Kategorie für Gruppen"
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={editingBenchmark ? handleUpdateBenchmark : handleAddBenchmark}
                className="flex-1"
              >
                {editingBenchmark ? 'Aktualisieren' : 'Erstellen'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingBenchmark(null)
                  setFormData({
                    benchmark_name: '',
                    description: '',
                    answer_value: '',
                    score: 0,
                    category: '',
                  })
                }}
                className="flex-1 bg-transparent"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Frage
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Benchmark
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Antwort-Wert
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Punktzahl
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBenchmarks.map((benchmark) => {
                const question = questions.find((q) => q.id === benchmark.question_id)
                return (
                  <tr key={benchmark.id} className="border-b border-border hover:bg-background">
                    <td className="px-6 py-4 text-foreground">
                      {question?.question_text.substring(0, 40)}...
                    </td>
                    <td className="px-6 py-4 text-foreground">{benchmark.benchmark_name}</td>
                    <td className="px-6 py-4 text-foreground">{benchmark.answer_value}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                        {benchmark.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingBenchmark(benchmark)
                          setFormData({
                            benchmark_name: benchmark.benchmark_name,
                            description: benchmark.description || '',
                            answer_value: benchmark.answer_value,
                            score: benchmark.score,
                            category: benchmark.category || '',
                          })
                          setShowForm(true)
                        }}
                        className="bg-transparent"
                      >
                        Bearbeiten
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteBenchmark(benchmark.id)}
                      >
                        Löschen
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredBenchmarks.length === 0 && (
          <div className="px-6 py-8 text-center text-muted-foreground">
            Keine Benchmarks gefunden. Erstellen Sie einen neuen Benchmark.
          </div>
        )}
      </div>
    </div>
  )
}
