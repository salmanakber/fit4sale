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
  Loader2,
  ListFilter
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
    type 
  }: { 
    active: boolean | null | undefined, 
    label: string, 
    type: 'success' | 'warning' | 'neutral' 
  }) => {
    const styles = {
      success: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10",
      warning: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10",
      neutral: "bg-slate-50 text-slate-600 border-slate-200 ring-slate-500/10",
    }
    
    let finalType = type;
    if (type === 'success' && !active) finalType = 'neutral';
    
    const displayLabel = active ? label : (type === 'success' ? 'Ausstehend' : label);
    const Icon = active ? CheckCircle2 : Clock;

    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ring-1 ring-inset", 
        styles[finalType]
      )}>
        <Icon className="h-3 w-3" />
        {displayLabel}
      </span>
    )
  }

  // --- Render ---

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Daten werden geladen...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Eingaben Übersicht</h2>
          <p className="text-sm text-slate-500">
            Verwalten Sie alle eingegangenen Quiz-Antworten und Patienten-Freigaben.
          </p>
        </div>
        
        {/* Total Count Badge */}
        <div className="flex items-center">
           <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
             <ListFilter className="h-4 w-4 text-slate-400" />
             <span className="text-sm font-medium text-slate-600">Total:</span>
             <span className="rounded-md bg-blue-50 px-2 py-0.5 text-sm font-bold text-blue-700">
               {filteredSubmissions.length}
             </span>
           </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Suche nach Name oder E-Mail…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 border-slate-200 bg-white pl-10 text-base shadow-sm focus-visible:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="bg-slate-50/75 text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 font-semibold">Teilnehmer/in</th>
                <th className="px-6 py-4 font-semibold">Kontakt</th>
                <th className="px-6 py-4 font-semibold">Vorläufige Mail</th>
                <th className="px-6 py-4 font-semibold">Freigabe Status</th>
                <th className="px-6 py-4 font-semibold">Eingereicht Am</th>
                <th className="px-6 py-4 text-right font-semibold">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((submission) => (
                  <tr 
                    key={submission.id} 
                    className="group transition-colors hover:bg-slate-50/60"
                  >
                    {/* Patient Name + Avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 shadow-sm ring-2 ring-white">
                            {getInitials(submission.patient_name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {submission.patient_name || 'Unbekannt'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-slate-500">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{submission.patient_email || submission.participant_email || '—'}</span>
                       </div>
                    </td>

                    {/* Partial Status */}
                    <td className="px-6 py-4">
                      <StatusBadge 
                        active={submission.partial_evaluation_sent} 
                        label="Gesendet" 
                        type="success" 
                      />
                    </td>

                    {/* Approval Status */}
                    <td className="px-6 py-4">
                        {submission.full_evaluation_approved ? (
                             <StatusBadge active={true} label="Freigegeben" type="success" />
                        ) : (
                             <StatusBadge active={false} label="Offen" type="warning" />
                        )}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-slate-500">
                       <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(submission.submitted_at || submission.created_at)}
                       </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <Button 
                        asChild 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
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
                /* Empty State */
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                       <div className="mb-4 rounded-full bg-slate-50 p-4 ring-1 ring-slate-100">
                         <Search className="h-6 w-6 text-slate-400" />
                       </div>
                       <h3 className="mb-1 text-base font-semibold text-slate-900">Keine Eingaben gefunden</h3>
                       <p className="text-sm text-slate-500">
                         Es gibt keine Ergebnisse für "{searchQuery}".
                       </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer / Stats Bar */}
        {filteredSubmissions.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <p className="text-xs font-medium text-slate-500">
                    Zeige alle {filteredSubmissions.length} Ergebnisse
                </p>
            </div>
        )}
      </div>
    </div>
  );
}
