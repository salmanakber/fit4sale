'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

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

const COLORS = {
  achieved: '#ef4444', // Red for achieved score
  benchmark: '#10b981', // Green for benchmark
  background: '#1a1a1a', // Dark background
  text: '#e5e7eb', // Light text
  grid: '#374151', // Dark grid
}

export function BenchmarkReportChart({ submissionId }: BenchmarkReportChartProps) {
  const [data, setData] = useState<any[]>([])
  const [submissionName, setSubmissionName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBenchmarkData = async () => {
      try {
        const response = await fetch(`/api/admin/submissions/${submissionId}/benchmark-report`)
        if (!response.ok) {
          throw new Error('Failed to fetch benchmark data')
        }
        const result = await response.json()
        console.log(result)

        // Transform data for chart
        const chartData = result.benchmark_data.map((item: BenchmarkData) => ({
          name: item.question_name.substring(0, 30), // Truncate long names
          fullName: item.question_name,
          achieved: item.achieved_score,
          benchmark: item.benchmark_score,
          isSelected: item.is_selected_benchmark,
        }))

        setData(chartData)
        setSubmissionName(result.submission_name || 'Submission')
        setError(null)
      } catch (err) {
        console.error('[v0] Error fetching benchmark data:', err)
        setError('Failed to load benchmark report')
      } finally {
        setIsLoading(false)
      }
    }

    if (submissionId) {
      fetchBenchmarkData()
    }
  }, [submissionId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-400">Loading benchmark report...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        {error}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        No benchmark data available
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Benchmark Report</h2>
        <p className="text-sm text-gray-600 mt-1">Comparison of achieved scores vs benchmark targets</p>
      </div>

      {/* Chart Container with Black Background */}
      <div className="rounded-lg border border-gray-200 overflow-hidden shadow-lg">
        <div style={{ backgroundColor: COLORS.background, padding: '24px' }}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.grid}
                vertical={true}
              />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={150}
                tick={{ fill: COLORS.text, fontSize: 12 }}
              />
              <YAxis
                label={{ value: 'Score', angle: -90, position: 'insideLeft', fill: COLORS.text }}
                tick={{ fill: COLORS.text }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: COLORS.background,
                  border: `1px solid ${COLORS.grid}`,
                  color: COLORS.text,
                  borderRadius: '6px',
                }}
                labelStyle={{ color: COLORS.text }}
                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="square"
              />

              {/* Achieved Score Bar */}
              <Bar dataKey="achieved" name="Achieved (IST)" fill={COLORS.achieved} radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-achieved-${index}`}
                    fill={entry.isSelected ? '#dc2626' : COLORS.achieved}
                    opacity={entry.isSelected ? 1 : 0.7}
                  />
                ))}
              </Bar>

              {/* Benchmark Score Bar */}
              <Bar dataKey="benchmark" name="Benchmark (Potential)" fill={COLORS.benchmark} radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-benchmark-${index}`}
                    fill={COLORS.benchmark}
                    opacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend & Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dc2626' }} />
          <span className="text-sm font-medium text-gray-900">Achieved (Highlighted = Selected Benchmark)</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.benchmark }} />
          <span className="text-sm font-medium text-gray-900">Benchmark Target</span>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">Report for: {submissionName}</p>
        </div>
      </div>

      {/* Summary Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Question</th>
              <th className="border border-gray-200 px-4 py-2 text-center font-semibold">Achieved</th>
              <th className="border border-gray-200 px-4 py-2 text-center font-semibold">Benchmark</th>
              <th className="border border-gray-200 px-4 py-2 text-center font-semibold">Difference</th>
              <th className="border border-gray-200 px-4 py-2 text-center font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const diff = row.achieved - row.benchmark
              const status = diff >= 0 ? '✓ Passed' : '✗ Below Target'
              return (
                <tr key={idx} className={row.isSelected ? 'bg-red-50' : 'hover:bg-gray-50'}>
                  <td className="border border-gray-200 px-4 py-2 font-medium text-gray-900 max-w-xs truncate" title={row.fullName}>
                    {row.fullName}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-center text-gray-700">{row.achieved}</td>
                  <td className="border border-gray-200 px-4 py-2 text-center text-gray-700">{row.benchmark}</td>
                  <td className={`border border-gray-200 px-4 py-2 text-center font-semibold ${diff >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {diff >= 0 ? '+' : ''}{diff}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-center text-xs font-semibold">
                    <span className={`px-2 py-1 rounded ${diff >= 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
