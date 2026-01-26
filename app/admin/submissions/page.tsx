'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Mail, 
  User, 
  Calendar, 
  Loader2 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Submission {
  id: string
  patient_name: string | null
  patient_email: string | null
  participant_email: string | null
  partial_evaluation_sent?: boolean | null
  full_evaluation_pending?: boolean | null
  full_evaluation_approved?: boolean | null
  created_at: string
  submitted_at?: string | null
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch('/api/admin/submissions')
        if (response.ok) {
          const data = await response.json()
          setSubmissions(data.submissions || [])
          setFilteredSubmissions(data.submissions || [])
        }
      } catch (error) {
        console.error('[v0] Error fetching submissions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubmissions()
  }, [])

  useEffect(() => {
    const filtered = submissions.filter(
      (submission) =>
        (submission.patient_name || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (submission.patient_email || submission.participant_email || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    )
    setFilteredSubmissions(filtered)
  }, [searchQuery, submissions])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Helper for Status Badges
  const StatusBadge = ({ active, label, type }: { active: boolean | null | undefined, label: string, type: 'success' | 'warning' | 'neutral' }) => {
    const styles = {
      success: "bg-emerald-100 text-emerald-700 border-emerald-200",
      warning: "bg-amber-100 text-amber-700 border-amber-200",
      neutral: "bg-slate-100 text-slate-600 border-slate-200",
    }
    
    // If we want different colors based on boolean state
    let finalType = type;
    if (type === 'success' && !active) finalType = 'neutral';
    
    // Override label for neutral state if needed, or keep generic
    const displayLabel = active ? label : (type === 'success' ? 'Ausstehend' : label);

    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", styles[finalType])}>
        {active ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
        {displayLabel}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
          <p className="text-sm text-slate-500">Daten werden geladen...</p>
        </div>
      </div>
    )
  }

  return (

    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Survey Entries</h2>
        <div className="text-sm text-muted-foreground">
          Total: {filteredSubmissions.length}

    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-blue-950">Eingaben Übersicht</h2>
          <p className="text-sm text-slate-500 mt-1">
            Verwalten Sie alle eingegangenen Quiz-Antworten und Freigaben.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <span className="bg-white px-3 py-1 rounded-md shadow-sm border border-slate-200 text-sm font-medium text-slate-600">
             Total: <span className="text-blue-600">{filteredSubmissions.length}</span>
           </span>

        </div>
      </div>

      {/* Search & Toolbar */}
      <div className="flex items-center rounded-xl bg-white p-4 shadow-sm border border-slate-100">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Suche nach Name oder E-Mail…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-slate-200 bg-slate-50 focus-visible:ring-blue-500"
          />
        </div>
      </div>


      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="border-b border-border bg-secondary">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Participant
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Email
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Partial Email
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Full Approved
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.length > 0 ? (
              filteredSubmissions.map((submission) => (
                <tr key={submission.id} className="border-b border-border hover:bg-secondary/50">
                  <td className="px-6 py-4 text-sm text-foreground">
                    {submission.patient_name || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {submission.patient_email || submission.participant_email || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {submission.partial_evaluation_sent ? 'Sent' : 'Not sent'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {submission.full_evaluation_approved ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(submission.submitted_at || submission.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/admin/submissions/${submission.id}`}
                      className="text-primary hover:underline"
                    >
                      View Details
                    </Link>

      {/* Main Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Teilnehmer/in
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Kontakt
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Vorläufige Mail
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Freigabe Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Eingereicht Am
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Aktion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((submission) => (
                  <tr 
                    key={submission.id} 
                    className="group transition-colors hover:bg-blue-50/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                            <User className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-slate-900">
                          {submission.patient_name || 'Unbekannt'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {submission.patient_email || submission.participant_email || '—'}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge 
                        active={submission.partial_evaluation_sent} 
                        label="Gesendet" 
                        type="success" 
                      />
                    </td>
                    <td className="px-6 py-4">
                        {submission.full_evaluation_approved ? (
                             <StatusBadge active={true} label="Freigegeben" type="success" />
                        ) : (
                             <StatusBadge active={false} label="Offen" type="warning" />
                        )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                       <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(submission.submitted_at || submission.created_at)}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        asChild 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Link href={`/admin/submissions/${submission.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Details
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                       <div className="mb-3 rounded-full bg-slate-100 p-3">
                         <Search className="h-6 w-6" />
                       </div>
                       <p className="text-lg font-medium text-slate-900">Keine Eingaben gefunden</p>
                       <p className="text-sm">Bitte überprüfen Sie Ihre Sucheinstellungen.</p>
                    </div>

                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer of Table (Pagination Placeholder) */}
        {filteredSubmissions.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3">
                <p className="text-xs text-slate-500">
                    Zeige alle {filteredSubmissions.length} Ergebnisse
                </p>
            </div>
        )}
      </div>
    </div>
  )
}
