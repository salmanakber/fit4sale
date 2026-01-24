'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Users, 
  FileText, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Settings, 
  TrendingUp 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingApprovals: 0,
    totalEvaluations: 0,
    partialEmailsSent: 0,
    fullEmailsSent: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Fetch stats (real data)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        if (!res.ok) throw new Error('Failed to fetch stats')
        const data = await res.json()
        setStats(data.stats)
      } catch (error) {
        console.error('Failed to fetch stats')
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  // Component for the Top Stats Cards
  const StatCard = ({ title, value, icon: Icon, colorClass, trend }: any) => (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-slate-100"></div>
            ) : (
                <span className="text-3xl font-bold text-blue-950">{value}</span>
            )}
          </div>
        </div>
        <div className={cn("rounded-lg p-3", colorClass)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      {/* Decorative Trend Line (Static for design) */}
      <div className="mt-4 flex items-center gap-1 text-xs text-slate-400">
         <TrendingUp className="h-3 w-3 text-emerald-500" />
         <span className="text-emerald-600 font-medium">+12%</span> 
         <span>seit letztem Monat</span>
      </div>
    </div>
  )

  // Component for Quick Action Cards
  const ActionCard = ({ title, description, icon: Icon, href, color }: any) => (
    <Link href={href} className="group relative block h-full">
      <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-blue-200 group-hover:shadow-lg">
        <div>
          <div className={cn("mb-4 inline-flex rounded-lg p-3 transition-colors", color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-slate-800 group-hover:text-blue-700">
            {title}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {description}
          </p>
        </div>
        <div className="mt-6 flex items-center text-sm font-semibold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
          Öffnen <ArrowRight className="ml-2 h-4 w-4" />
        </div>
      </div>
    </Link>
  )

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-blue-950">Dashboard</h1>
        <p className="text-slate-500">
          Willkommen zurück. Hier ist der aktuelle Status Ihrer Fit4Sale-Auswertungen.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard 
            title="Eingaben Total" 
            value={stats.totalSubmissions} 
            icon={Users} 
            colorClass="bg-blue-600"
        />
        <StatCard 
            title="Offene Freigaben" 
            value={stats.pendingApprovals} 
            icon={Clock} 
            colorClass="bg-amber-500" 
        />
        <StatCard 
            title="Auswertungen" 
            value={stats.totalEvaluations} 
            icon={CheckCircle2} 
            colorClass="bg-emerald-500" 
        />
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="mb-6 text-lg font-bold text-blue-950 flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-400" />
            Verwaltung & Aktionen
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            <ActionCard
                title="Eingaben prüfen"
                description="Sehen Sie sich neue Antworten der Teilnehmenden an und starten Sie den Bewertungsprozess."
                icon={Users}
                href="/admin/submissions"
                color="bg-indigo-600 group-hover:bg-indigo-700"
            />

            <ActionCard
                title="Auswertungen"
                description="Erstellen Sie Auswertungen, geben Sie diese frei und versenden Sie E-Mails."
                icon={BarChart3}
                href="/admin/evaluations"
                color="bg-emerald-600 group-hover:bg-emerald-700"
            />

            <ActionCard
                title="Quiz Konfiguration"
                description="Bearbeiten Sie Fragen, Antwortoptionen und passen Sie den Intro-Text an."
                icon={FileText}
                href="/admin/quiz"
                color="bg-slate-700 group-hover:bg-slate-800"
            />
        </div>
      </div>

      {/* Recent Activity Placeholder (Optional Polish) */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">E-Mail Versand</h3>
            <span className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                System Aktiv
            </span>
          </div>
          <p className="text-sm text-slate-500">
             Vorläufige E-Mails gesendet: <span className="font-semibold text-slate-800">{stats.partialEmailsSent}</span> · Vollständige E-Mails gesendet: <span className="font-semibold text-slate-800">{stats.fullEmailsSent}</span>
          </p>
      </div>

    </div>
  );
}
