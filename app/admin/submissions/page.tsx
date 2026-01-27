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
  Calendar, 
  Loader2,
  ListFilter,
  FileText,
  AlertCircle,
  ArrowUpRight,
  Download
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
        // Mock API call - replace with your real endpoint
        const response = await fetch('/api/admin/submissions')
        if (response.ok) {
          const data = await response.json()
          setSubmissions(data.submissions || [])
          setFilteredSubmissions(data.submissions || [])
        }
      } catch (error) {
        console.error('Error fetching submissions:', error)
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

  // --- Helpers ---

  const formatDate = (dateString: string) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('de-CH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  // --- Components ---

  const StatusBadge = ({ 
    active, 
    label, 
    variant 
  }: { 
    active: boolean | null | undefined, 
    label: string, 
    variant: 'success' | 'pending' | 'blue' 
  }) => {
    // Logic to determine visual state
    let state = 'neutral';
    let icon = Clock;
    
    if (variant === 'success' && active) {
        state = 'success';
        icon = CheckCircle2;
    } else if (variant === 'blue' && active) {
        state = 'blue';
        icon = CheckCircle2;
    } else if (variant === 'pending' && !active) {
        state = 'warning';
        icon = AlertCircle;
    }

    const styles = {
      success: "bg-emerald-50 text-emerald-700 border-emerald-200",
      blue: "bg-blue-50 text-blue-700 border-blue-200",
      warning: "bg-amber-50 text-amber-700 border-amber-200",
      neutral: "bg-slate-50 text-slate-500 border-slate-200",
    }
    
    const IconComponent = icon;

    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-sm", 
        // @ts-ignore
        styles[state] || styles.neutral
      )}>
        <IconComponent className="h-3 w-3" />
        {active ? label : (variant === 'pending' ? 'Ausstehend' : 'Nicht gesendet')}
      </span>
    )
  }

  // --- Render ---

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-950" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Lade Eingaben...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pt-8">
      
        {/* --- Header Section --- */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-950 flex items-center gap-3">
              <div className="p-2 bg-blue-950 rounded-lg shadow-lg shadow-blue-900/20">
                <FileText className="h-6 w-6 text-white" />
              </div>
              Eingaben & Resultate
            </h1>
            <p className="mt-2 text-base text-slate-500">
              Übersicht aller Quiz-Teilnahmen und deren Bearbeitungsstatus.
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4">
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <ListFilter className="h-4 w-4 text-blue-700" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-medium uppercase">Total</p>
                    <p className="text-lg font-bold text-blue-950 leading-none">{filteredSubmissions.length}</p>
                </div>
            </div>
          </div>
        </div>

        {/* --- Toolbar Section --- */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    type="search"
                    placeholder="Suche nach Name, E-Mail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 border-transparent bg-slate-50 pl-10 text-sm focus-visible:bg-white focus-visible:ring-blue-950 transition-all"
                />
            </div>
            <div className="flex w-full sm:w-auto gap-2">
                 <Button variant="outline" size="sm" className="ml-auto text-slate-600 hover:text-blue-950 hover:border-blue-200">
                    <ListFilter className="mr-2 h-4 w-4" /> Filter
                </Button>
                <Button variant="outline" size="sm" className="text-slate-600 hover:text-blue-950 hover:border-blue-200">
                    <Download className="mr-2 h-4 w-4" /> Export
                </Button>
            </div>
        </div>

        {/* --- Main Table Card --- */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-blue-900/5">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-blue-950/70 uppercase text-xs tracking-wider">Teilnehmer/in</th>
                  <th className="px-6 py-4 font-bold text-blue-950/70 uppercase text-xs tracking-wider">Vorläufiger Status</th>
                  <th className="px-6 py-4 font-bold text-blue-950/70 uppercase text-xs tracking-wider">Freigabe Status</th>
                  <th className="px-6 py-4 font-bold text-blue-950/70 uppercase text-xs tracking-wider">Eingereicht Am</th>
                  <th className="px-6 py-4 text-right font-bold text-blue-950/70 uppercase text-xs tracking-wider">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((submission) => (
                    <tr 
                      key={submission.id} 
                      className="group transition-colors hover:bg-blue-50/30"
                    >
                      {/* Name & Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-950 text-sm font-bold text-white shadow-md shadow-blue-900/10">
                              {getInitials(submission.patient_name)}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                              {submission.patient_name || 'Unbekannt'}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[180px]" title={submission.patient_email || submission.participant_email || ''}>
                                    {submission.patient_email || submission.participant_email || '—'}
                                </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Partial (Automated) Status */}
                      <td className="px-6 py-4">
                        <StatusBadge 
                          active={submission.partial_evaluation_sent} 
                          label="Auto-Mail gesendet" 
                          variant="success" 
                        />
                      </td>

                      {/* Approval (Manual) Status */}
                      <td className="px-6 py-4">
                          {submission.full_evaluation_approved ? (
                               <StatusBadge active={true} label="Vollständig" variant="blue" />
                          ) : (
                               <StatusBadge active={false} label="Ausstehend" variant="pending" />
                          )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2 text-slate-700 font-medium">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                {formatDate(submission.submitted_at || submission.created_at)}
                             </div>
                             <span className="text-xs text-slate-400 pl-5.5">
                                {new Date(submission.created_at).toLocaleTimeString('de-CH', {hour: '2-digit', minute:'2-digit'})} Uhr
                             </span>
                         </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <Button 
                          asChild 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-500 hover:text-blue-700 hover:bg-blue-50 font-medium group-hover:bg-white group-hover:shadow-sm group-hover:border-slate-200 group-hover:border transition-all"
                        >
                          <Link href={`/admin/submissions/${submission.id}`} className="flex items-center">
                            Details anzeigen
                            <ArrowUpRight className="ml-1.5 h-3.5 w-3.5 opacity-50" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  /* Empty State */
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                         <div className="mb-4 rounded-full bg-slate-50 p-4 ring-1 ring-slate-100 shadow-sm">
                           <Search className="h-8 w-8 text-slate-300" />
                         </div>
                         <h3 className="mb-2 text-lg font-semibold text-slate-900">Keine Ergebnisse gefunden</h3>
                         <p className="text-sm text-slate-500 mb-6 text-center">
                           Wir konnten keine Einträge finden, die mit "{searchQuery}" übereinstimmen.
                         </p>
                         <Button variant="outline" onClick={() => setSearchQuery('')}>
                            Suche zurücksetzen
                         </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer */}
          {filteredSubmissions.length > 0 && (
              <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex justify-between items-center">
                  <p className="text-xs text-slate-500">
                    Zeige <span className="font-medium text-slate-900">{filteredSubmissions.length}</span> von {submissions.length} Einträgen
                  </p>
                  <div className="flex gap-2">
                     {/* Pagination placeholders could go here */}
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
