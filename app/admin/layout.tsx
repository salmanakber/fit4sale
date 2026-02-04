'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  FileText,
  Inbox,
  BarChart3,
  LogOut,
  Loader2,
  Menu,
  X,
  User,
  Settings,
  Zap,
  TrendingUp,
  SettingsIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Logic to handle login page vs admin pages
  const isLoginPage = pathname === '/admin/login'
  const [isLoadingThis, setIsLoading] = useState(!isLoginPage)

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  useEffect(() => {
    if (isLoginPage) return

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check-auth', {
          method: 'GET',
          credentials: 'include',
        })

        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          router.push('/admin/login')
        }
      } catch (error) {
        router.push('/admin/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, isLoginPage])

  if (isLoginPage) return <>{children}</>

  if (isLoadingThis) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0B1120] shadow-2xl shadow-blue-900/20">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
          <p className="animate-pulse text-xs font-bold tracking-[0.2em] text-blue-950 uppercase">
            Fit4Sale Admin
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  // Navigation Configuration
  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Quiz-Verwaltung', href: '/admin/quiz', icon: FileText },
    { name: 'Eingaben', href: '/admin/submissions', icon: Inbox },
    { name: 'Auswertungen', href: '/admin/evaluations', icon: BarChart3 },
    { name: 'Benchmarks', href: '/admin/benchmarks', icon: Zap },
    { name: 'Reporting data', href: '/admin/reporting', icon: TrendingUp },
  ]

  const settingsItems = [
    { name: 'Einstellungen', href: '/admin/settings', icon: SettingsIcon },
  ]

  // Sidebar Content Component (Reused for Mobile and Desktop)
  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-[#0B1120] text-slate-300">
      {/* Logo Area */}
      <div className="flex h-20 items-center px-6 border-b border-white/5">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="relative h-10 w-auto">
            <Image
              src="/fit4sale-logo.png"
              alt="Fit4Sale"
              width={140}
              height={50}
              className="object-contain brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
            />
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
        <div className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          Hauptmenü
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer Profile */}
      <div className="border-t border-white/5 bg-[#080c17] p-4">
        <div className="mb-4 space-y-1 px-1">
          {settingsItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                {item.name}
              </Link>
            )
          })}
        </div>
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/20 ring-1 ring-blue-500/50">
              <User className="h-5 w-5 text-blue-400" />
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-white">Administrator</p>
              <p className="truncate text-xs text-slate-500">Fit4Sale System</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Abmelden</span>
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen w-full bg-slate-50 font-sans">

      {/* --- DESKTOP SIDEBAR (Hidden on mobile) --- */}
      <aside className="hidden w-72 flex-col fixed inset-y-0 z-50 md:flex shadow-2xl">
        <SidebarContent />
      </aside>

      {/* --- MOBILE LAYOUT --- */}

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="h-6 w-6 text-slate-700" />
          </Button>
          <span className="font-bold text-blue-950">Fit4Sale Admin</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-blue-950 flex items-center justify-center">
          <span className="text-xs text-white font-bold">A</span>
        </div>
      </div>

      {/* Mobile Sidebar (Slide-over) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-blue-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-72 bg-[#0B1120] shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-6 w-6" />
              </Button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 md:pl-72 transition-all duration-300">
        {/* Desktop Header */}
        <header className="hidden md:flex sticky top-0 z-30 h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md">
          <div>
            <h1 className="text-xl font-bold text-slate-800 capitalize tracking-tight">
              {navItems.find(i => i.href === pathname)?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              v1.0.0
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 pt-20 md:pt-8 min-h-[calc(100vh-4rem)]">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
