'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AlertCircle, Download, Filter, TrendingUp, Loader2, Activity } from 'lucide-react';

interface QuestionResult {
  questionId: string;
  questionText: string;
  category: string;
  answerValue: string;
  achievedScore: number;
  benchmarkScore: number;
  deviation: number;
}

interface CategoryResult {
  category: string;
  totalScore: number;
  benchmarkScore: number;
  percentage: number;
  questionCount: number;
}

interface EvaluationResult {
  submissionId: string;
  participantName: string;
  participantEmail: string;
  submittedAt: string;
  totalScore: number;
  benchmarkScore: number;
  deviation: number;
  questionResults: QuestionResult[];
  categoryResults: CategoryResult[];
}

interface CategoryScore {
  name: string;
  achieved: number;
  benchmark: number;
}

export default function AuswertungenPage() {
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationResult | null>(null);
  const [filterEmail, setFilterEmail] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [evaluations, filterEmail]);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/evaluations');
      if (!response.ok) throw new Error('Failed to fetch evaluations');
      const data = await response.json();
      setEvaluations(data);
      
      // Extract unique categories
      const uniqueCategories = new Set<string>();
      data.forEach((eval: EvaluationResult) => {
        eval.categoryResults.forEach((cat) => {
          uniqueCategories.add(cat.category);
        });
      });
      setCategories(Array.from(uniqueCategories));
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = evaluations;
    
    if (filterEmail) {
      filtered = filtered.filter((e) =>
        e.participantEmail.toLowerCase().includes(filterEmail.toLowerCase())
      );
    }
    
    setFilteredEvaluations(filtered);
  };

  const calculateAverageMetrics = () => {
    if (filteredEvaluations.length === 0) {
      return { avgScore: 0, avgBenchmark: 0, avgDeviation: 0 };
    }
    
    const totals = filteredEvaluations.reduce(
      (acc, e) => ({
        score: acc.score + e.totalScore,
        benchmark: acc.benchmark + e.benchmarkScore,
        deviation: acc.deviation + e.deviation,
      }),
      { score: 0, benchmark: 0, deviation: 0 }
    );
    
    return {
      avgScore: Math.round(totals.score / filteredEvaluations.length),
      avgBenchmark: Math.round(totals.benchmark / filteredEvaluations.length),
      avgDeviation: Math.round(totals.deviation / filteredEvaluations.length),
    };
  };

  const getCategoryAggregateData = (): CategoryScore[] => {
    if (filteredEvaluations.length === 0) return [];
    
    const categoryMap = new Map<string, { achieved: number; benchmark: number; count: number }>();
    
    filteredEvaluations.forEach((eval) => {
      eval.categoryResults.forEach((cat) => {
        const existing = categoryMap.get(cat.category) || { achieved: 0, benchmark: 0, count: 0 };
        categoryMap.set(cat.category, {
          achieved: existing.achieved + cat.totalScore,
          benchmark: existing.benchmark + cat.benchmarkScore,
          count: existing.count + 1,
        });
      });
    });
    
    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      achieved: Math.round(data.achieved / data.count),
      benchmark: Math.round(data.benchmark / data.count),
    }));
  };

  const getRadarData = () => {
    if (!selectedEvaluation) return [];
    
    return selectedEvaluation.categoryResults.map((cat) => ({
      category: cat.category,
      achieved: cat.totalScore,
      benchmark: cat.benchmarkScore,
      fullMark: Math.max(cat.totalScore, cat.benchmarkScore) + 10,
    }));
  };

  const getTrendData = () => {
    return filteredEvaluations
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
      .map((e) => ({
        name: new Date(e.submittedAt).toLocaleDateString('de-CH'),
        achieved: e.totalScore,
        benchmark: e.benchmarkScore,
      }));
  };

  const metrics = calculateAverageMetrics();
  const categoryData = getCategoryAggregateData();
  const radarData = getRadarData();
  const trendData = getTrendData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 border-4 border-blue-900 border-t-blue-400 rounded-full mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Laden der Auswertungen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-700" />
            Auswertungen
          </h1>
          <p className="text-slate-600">Detaillierte Analyse der Umfrageergebnisse und Vergleiche mit Benchmarks</p>
        </div>

        {/* Filters */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email-filter">E-Mail filtern</Label>
                <Input
                  id="email-filter"
                  placeholder="E-Mail-Adresse eingeben..."
                  value={filterEmail}
                  onChange={(e) => setFilterEmail(e.target.value)}
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Gefilterte Ergebnisse: {filteredEvaluations.length}</Label>
                <Button
                  onClick={fetchEvaluations}
                  variant="outline"
                  className="w-full"
                >
                  Aktualisieren
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Durchschn. Erreichte Punkte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{metrics.avgScore}</div>
              <p className="text-xs text-blue-700 mt-1">über {filteredEvaluations.length} Auswertungen</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-900">Durchschn. Benchmark</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{metrics.avgBenchmark}</div>
              <p className="text-xs text-green-700 mt-1">Best in Class Standard</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-900">Durchschn. Abweichung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${metrics.avgDeviation > 0 ? 'text-red-900' : 'text-green-900'}`}>
                {metrics.avgDeviation > 0 ? '-' : '+'}{Math.abs(metrics.avgDeviation)}
              </div>
              <p className="text-xs text-amber-700 mt-1">{metrics.avgDeviation > 0 ? 'unter' : 'über'} Benchmark</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown - Bar Chart */}
        {categoryData.length > 0 && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Kategorien-Übersicht</CardTitle>
              <CardDescription>Vergleich der durchschnittlichen Werte pro Kategorie</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="achieved" fill="#3b82f6" name="Erreichte Punkte" />
                  <Bar dataKey="benchmark" fill="#10b981" name="Benchmark" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Score Breakdown by Question - When Individual Selected */}
        {selectedEvaluation && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Detaillierte Ergebnisse</CardTitle>
              <CardDescription>{selectedEvaluation.participantName} ({selectedEvaluation.participantEmail})</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium">Gesamt Erreicht</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedEvaluation.totalScore}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-700 font-medium">Benchmark</p>
                  <p className="text-2xl font-bold text-green-900">{selectedEvaluation.benchmarkScore}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <p className="text-sm text-amber-700 font-medium">Abweichung</p>
                  <p className={`text-2xl font-bold ${selectedEvaluation.deviation > 0 ? 'text-red-900' : 'text-green-900'}`}>
                    {selectedEvaluation.deviation > 0 ? '-' : '+'}{Math.abs(selectedEvaluation.deviation)}
                  </p>
                </div>
              </div>

              {/* Questions Breakdown */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Pro Frage</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedEvaluation.questionResults.map((q, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 text-sm">{q.questionText}</p>
                          <p className="text-xs text-slate-500 mt-1">Antwort: {q.answerValue}</p>
                          <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {q.category}
                          </span>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-bold text-slate-900">{q.achievedScore} / {q.benchmarkScore}</p>
                          <p className={`text-xs ${q.deviation > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {q.deviation > 0 ? '-' : '+'}{Math.abs(q.deviation)}
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min((q.achievedScore / q.benchmarkScore) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Radar Chart - Multidimensional Comparison */}
        {radarData.length > 0 && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Mehrdimensionaler Vergleich (Radar)</CardTitle>
              <CardDescription>Visualisierung der Leistung nach Kategorie</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 'dataMax + 20']} />
                  <Radar name="Erreicht" dataKey="achieved" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                  <Radar name="Benchmark" dataKey="benchmark" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Trend Chart - Score Development Over Time */}
        {trendData.length > 1 && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Entwicklungstrend
              </CardTitle>
              <CardDescription>Zeitliche Entwicklung der Ergebnisse</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="achieved" stroke="#3b82f6" name="Erreichte Punkte" strokeWidth={2} />
                  <Line type="monotone" dataKey="benchmark" stroke="#10b981" name="Benchmark" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Results List */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Alle Auswertungen</CardTitle>
            <CardDescription>{filteredEvaluations.length} Ergebnis(se) gefunden</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredEvaluations.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-slate-500">
                <AlertCircle className="h-5 w-5 mr-2" />
                Keine Auswertungen gefunden
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredEvaluations.map((eval) => (
                  <div
                    key={eval.submissionId}
                    onClick={() => setSelectedEvaluation(eval)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedEvaluation?.submissionId === eval.submissionId
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-blue-400'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{eval.participantName}</p>
                        <p className="text-sm text-slate-500">{eval.participantEmail}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(eval.submittedAt).toLocaleDateString('de-CH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-900">{eval.totalScore}</p>
                        <p className="text-xs text-slate-500">/ {eval.benchmarkScore}</p>
                        <p className={`text-sm font-semibold mt-1 ${eval.deviation > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {eval.deviation > 0 ? '-' : '+'}{Math.abs(eval.deviation)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
