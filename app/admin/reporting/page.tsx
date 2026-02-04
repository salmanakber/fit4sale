'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Users,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Download,
  Loader2,
} from 'lucide-react'

interface Analytics {
  summary: {
    totalEngaged: number
    totalSubmitted: number
    approved: number
    completionRate: number
    todayEngaged: number
  }
  timeSeries: Array<{ date: string; count: number }>
  submissions: Array<{
    id: string
    patient_name: string | null
    patient_email: string | null
    participant_email: string | null
    created_at: string
    submitted_at: string | null
    full_evaluation_approved: boolean | null
  }>
}

export default function ReportingPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<'charts' | 'table'>('charts')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics')
        if (!response.ok) {
          throw new Error('Failed to fetch analytics')
        }
        const data = await response.json()
        setAnalytics(data)
        setError(null)
      } catch (err) {
        console.error('[v0] Error fetching analytics:', err)
        setError('Failed to load analytics data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const handleExportCSV = () => {
    if (!analytics?.submissions) return

    const headers = ['ID', 'Name', 'Email', 'Engagement Date', 'Submission Date', 'Approved']
    const rows = analytics.submissions.map(sub => [
      sub.id,
      sub.patient_name || '-',
      sub.patient_email || sub.participant_email || '-',
      new Date(sub.created_at).toLocaleDateString('de-CH'),
      sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('de-CH') : '-',
      sub.full_evaluation_approved ? 'Yes' : 'No',
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportExcel = () => {
    if (!analytics?.submissions) return

    // Create a simple Excel-like CSV (in real app, use xlsx library)
    const headers = ['ID', 'Name', 'Email', 'Engagement Date', 'Submission Date', 'Approved']
    const rows = analytics.submissions.map(sub => [
      sub.id,
      sub.patient_name || '-',
      sub.patient_email || sub.participant_email || '-',
      new Date(sub.created_at).toLocaleDateString('de-CH'),
      sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('de-CH') : '-',
      sub.full_evaluation_approved ? 'Yes' : 'No',
    ])

    const csv = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'application/vnd.ms-excel' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
        {error || 'Failed to load analytics'}
      </div>
    )
  }

  const { summary, timeSeries, submissions } = analytics

  const pieData = [
    { name: 'Submitted', value: summary.totalSubmitted },
    { name: 'Not Submitted', value: summary.totalEngaged - summary.totalSubmitted },
  ]

  const COLORS = ['#10b981', '#ef4444']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reporting & Analytics</h1>
        <p className="text-gray-600 mt-1">Track survey engagement, submissions, and completion rates</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engaged</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalEngaged}</div>
            <p className="text-xs text-gray-600">users started survey</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSubmitted}</div>
            <p className="text-xs text-gray-600">completed surveys</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.completionRate}%</div>
            <p className="text-xs text-gray-600">conversion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.approved}</div>
            <p className="text-xs text-gray-600">reports approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Engagement</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.todayEngaged}</div>
            <p className="text-xs text-gray-600">users today</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setSelectedTab('charts')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            selectedTab === 'charts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Graphical View
        </button>
        <button
          onClick={() => setSelectedTab('table')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            selectedTab === 'table'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Tabular View
        </button>
      </div>

      {/* Charts View */}
      {selectedTab === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Series Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>User Engagement Over Time (Last 30 Days)</CardTitle>
              <CardDescription>Daily new survey starts</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    name="New Users"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Submission Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Status</CardTitle>
              <CardDescription>Submitted vs. Not Submitted</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Approval Status */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Status</CardTitle>
              <CardDescription>Reports approved vs. pending</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Approved', value: summary.approved },
                      { name: 'Pending', value: summary.totalSubmitted - summary.approved },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table View */}
      {selectedTab === 'table' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>All Submissions</CardTitle>
              <CardDescription>Complete list of user submissions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button
                onClick={handleExportExcel}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">Name</th>
                    <th className="text-left px-4 py-2 font-semibold">Email</th>
                    <th className="text-left px-4 py-2 font-semibold">Engagement Date</th>
                    <th className="text-left px-4 py-2 font-semibold">Submission Date</th>
                    <th className="text-center px-4 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(sub => (
                    <tr key={sub.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{sub.patient_name || '-'}</td>
                      <td className="px-4 py-3 text-xs break-all">{sub.patient_email || sub.participant_email || '-'}</td>
                      <td className="px-4 py-3">{new Date(sub.created_at).toLocaleDateString('de-CH')}</td>
                      <td className="px-4 py-3">
                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('de-CH') : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          sub.full_evaluation_approved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sub.full_evaluation_approved ? '✓ Approved' : '◐ Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {submissions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No submissions yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
