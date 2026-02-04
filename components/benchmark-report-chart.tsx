'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, HelpCircle } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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

// 🎨 DESIGN CONFIGURATION (Matches the image)
const THEME = {
  background: '#1e293b', // Slate-900 (Dark Background)
  grid: '#334155',       // Slate-700 (Subtle grid lines)
  text: '#cbd5e1',       // Slate-300 (Light text)
  axis: '#94a3b8',       // Slate-400 

  // IST (Your Result) - Red/Orange from image
  //okk
  lineIst: '#f97316',    // Orange-500
  dotIst: '#c2410c',
  gold: "#c23412b"     // Orange-700

  // POTENTIAL (Benchmark) - Green/Grey from image
  linePot: '#84cc16',    // Lime-500
  dotPot: '#4d7c0f',     // Lime-700
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

        const chartData = result.benchmark_data
          .filter((item: BenchmarkData) => item.benchmark_score > 0 || item.achieved_score > 0)
          .map((item: BenchmarkData) => ({
            // Truncate for Y-Axis labels
            shortName: item.question_name.length > 20 ? item.question_name.substring(0, 20) + '...' : item.question_name,
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

  // --- Custom Dark Tooltip ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find full name from payload
      const fullName = payload[0]?.payload?.fullName || label

      return (
        <div className="bg-slate-800 border border-slate-700 shadow-2xl rounded-md p-3 text-xs z-50 text-slate-200">
          <p className="font-bold mb-2 border-b border-slate-600 pb-1 text-white">
            {fullName}
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-slate-400">IST (Ihr Wert):</span>
              <span className="font-bold ml-auto text-orange-400">{payload.find((p: any) => p.dataKey === 'achieved')?.value}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lime-500" />
              <span className="text-slate-400">Potential (Markt):</span>
              <span className="font-bold ml-auto text-lime-400">{payload.find((p: any) => p.dataKey === 'benchmark')?.value}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded flex items-center gap-2"><AlertCircle size={16} /> {error}</div>

  return (
    <div className="space-y-6">

      {/* 🟢 THE CHART CARD (Dark Mode) */}
      <div className="rounded-xl overflow-hidden bg-slate-900 shadow-xl border border-slate-800">

        {/* Header inside Chart */}
        <div className="pt-6 px-6 pb-2">
          <h2 className="text-xl font-semibold text-white tracking-tight">
            Verkaufsattraktivität Analyse
          </h2>
          <p className="text-sm text-slate-400">Vergleich IST-Zustand vs. Markt-Potential</p>
        </div>

        <div className="w-full h-[500px] pr-6">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              layout="vertical" /* 👈 KEY CHANGE: Vertical Layout */
              data={data}
              margin={{ top: 20, right: 20, bottom: 20, left: 40 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={THEME.grid}
                horizontal={false} /* Vertical grid lines for vertical chart */
              />

              {/* X-Axis contains the NUMBERS now */}
              <XAxis
                type="number"
                tick={{ fill: THEME.axis, fontSize: 12 }}
                axisLine={{ stroke: THEME.grid }}
                tickLine={false}
                domain={[0, 'auto']}
              />

              {/* Y-Axis contains the CATEGORIES now */}
              <YAxis
                dataKey="shortName"
                type="category"
                tick={{ fill: THEME.text, fontSize: 13, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                width={160} /* Space for labels */
              />

              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />

              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingTop: '10px' }}
              />

              {/* Line 1: Benchmark (Green/Potential) */}
              <Line
                name="Potential (Markt)"
                dataKey="benchmark"
                stroke={THEME.linePot}
                strokeWidth={3}
                dot={{ r: 5, fill: THEME.grid, stroke: THEME.linePot, strokeWidth: 2 }}
                activeDot={{ r: 7, fill: THEME.linePot }}
                type="monotone"
              />

              {/* Line 2: User (Red/IST) */}
              <Line
                name="IST (Ihr Wert)"
                dataKey="achieved"
                stroke={THEME.lineIst}
                strokeWidth={3}
                dot={{ r: 5, fill: THEME.dotIst, stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 8, fill: '#fff' }}
                type="monotone"
              />

            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ⚪️ DATA TABLE (Light Mode) */}
      <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm bg-white">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Detaildaten
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-xs uppercase">Kategorie</th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase">IST</th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase">Potential</th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase">Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, idx) => {
                const delta = row.achieved - row.benchmark
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{row.fullName}</td>
                    <td className="px-4 py-3 text-center font-bold text-orange-600">{row.achieved}</td>
                    <td className="px-4 py-3 text-center font-medium text-lime-600">{row.benchmark}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={cn("px-2 py-1 rounded text-xs font-bold",
                        delta >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      )}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}
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