'use client'

import { useEffect, useState } from 'react'
import { Loader2, TrendingUp, AlertCircle, HelpCircle } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts'
import { cn } from '@/lib/utils'

interface BenchmarkData {
  question_name: string
  question_id: string
  benchmark_score: number
  achieved_score: number
  is_selected_benchmark: boolean
}

interface BenchmarkReportChartProps {
  submissionId: string
}

// Farbschema: Business Premium
const COLORS = {
  userLine: '#dc2626',      // Rot-600 (Wunsch: User Matches Red)
  userFill: '#fee2e2',      // Rot-100 (Leichte Füllung)
  benchmarkLine: '#64748b', // Slate-500 (Dezenter Standard)
  grid: '#f1f5f9',          // Slate-100
  text: '#64748b',          // Slate-500
  tooltipBg: '#ffffff',
}

export function BenchmarkReportChart({ submissionId }: BenchmarkReportChartProps) {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBenchmarkData = async () => {
      try {
        const response = await fetch(`/api/admin/submissions/${submissionId}/benchmark-report`)
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Daten')
        }
        const result = await response.json()

        // Daten transformieren
        const chartData = result.benchmark_data
          .filter((item: BenchmarkData) => item.benchmark_score > 0 || item.achieved_score > 0)
          .map((item: BenchmarkData) => ({
            shortName: item.question_name.length > 15 ? item.question_name.substring(0, 15) + '...' : item.question_name,
            fullName: item.question_name,
            achieved: item.achieved_score,
            benchmark: item.benchmark_score,
            delta: item.achieved_score - item.benchmark_score
          }))

        setData(chartData)
        setError(null)
      } catch (err) {
        console.error('Benchmark Error:', err)
        setError('Daten konnten nicht visualisiert werden.')
      } finally {
        setIsLoading(false)
      }
    }

    if (submissionId) {
      fetchBenchmarkData()
    }
  }, [submissionId])

  // --- Custom Tooltip ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const userScore = payload.find((p: any) => p.dataKey === 'achieved')?.value
      const benchmarkScore = payload.find((p: any) => p.dataKey === 'benchmark')?.value
      // Wir holen den vollen Namen aus dem Payload des ersten Elements
      const fullName = payload[0]?.payload?.fullName || label

      return (
        <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-lg text-sm z-50">
          <p className="font-bold text-slate-900 mb-3 max-w-[250px] leading-snug border-b border-slate-100 pb-2">
            {fullName}
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-slate-600">Ihr Ergebnis:</span>
              <span className="font-bold text-slate-900 ml-auto">{userScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-500"></div>
              <span className="text-slate-600">Markt-Standard:</span>
              <span className="font-bold text-slate-900 ml-auto">{benchmarkScore}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600 mb-2" />
        <span className="text-sm font-medium">Generiere Performance-Kurve...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-2">
        <AlertCircle className="h-4 w-4" /> {error}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
        <HelpCircle className="h-10 w-10 mb-2 opacity-20" />
        <p>Keine Datenpunkte für die Kurven-Analyse verfügbar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Chart Section */}
      <div className="w-full h-[450px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorAchieved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.userLine} stopOpacity={0.1} />
                <stop offset="95%" stopColor={COLORS.userLine} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />

            <XAxis
              dataKey="shortName"
              tick={{ fill: COLORS.text, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />

            <YAxis
              tick={{ fill: COLORS.text, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 'auto']} // Skaliert automatisch, startet bei 0
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ paddingBottom: '20px', fontSize: '13px', fontWeight: 600 }}
            />

            {/* Benchmark Linie (Der Standard) */}
            <Line
              type="monotone"
              dataKey="benchmark"
              name="Markt-Standard (Soll)"
              stroke={COLORS.benchmarkLine}
              strokeWidth={2}
              strokeDasharray="5 5" // Gestrichelt für "Referenzwert"
              dot={{ r: 3, fill: COLORS.benchmarkLine }}
              activeDot={{ r: 5 }}
            />

            {/* User Linie (Das Profil) - MIT AREA FÜLLUNG */}
            <Area
              type="monotone"
              dataKey="achieved"
              stroke="none"
              fill="url(#colorAchieved)"
            />
            <Line
              type="monotone"
              dataKey="achieved"
              name="Ihr Profil (Ist)"
              stroke={COLORS.userLine} // ROT
              strokeWidth={3}
              dot={{ r: 4, fill: COLORS.userLine, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, strokeWidth: 0 }}
            />

          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Detail Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm mt-4">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Datenpunkte Details
          </h3>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 border-b border-slate-100 sticky top-0 shadow-sm z-10">
              <tr>
                <th className="px-4 py-3 font-semibold text-xs uppercase bg-slate-50">Kategorie</th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase bg-slate-50">Ihr Wert</th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase bg-slate-50">Standard</th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase bg-slate-50">Abweichung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.map((row, idx) => {
                const isPositive = row.delta >= 0
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700 text-xs">
                      {row.fullName}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-red-600 font-bold">
                      {row.achieved}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-400">
                      {row.benchmark}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "text-xs font-bold",
                        isPositive ? "text-emerald-600" : "text-red-500"
                      )}>
                        {isPositive ? '+' : ''}{row.delta}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}