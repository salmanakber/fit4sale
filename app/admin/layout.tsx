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
  Loader2 
} from 'lucide-react'
import { cn } from '@/lib/utils' // Assuming you have a cn utility, typical in shadcn/ui

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const isLoginPage = pathname === '/admin/login'

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoadingThis, setIsLoading] = useState(!isLoginPage)

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch (error) {
      console.error('[v0] Logout error:', error)
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
        console.error('[v0] Auth check error:', error)
        router.push('/admin/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, isLoginPage])

  // Login page: render directly
  if (isLoginPage) {
    return <>{children}</>
  }

  // Elegant Loading Screen
  if (isLoadingThis) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-950 shadow-xl">
             <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="animate-pulse text-sm font-medium text-blue-900 tracking-widest uppercase">
            System wird geladen...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  // Navigation Items Configuration
  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Quiz-Verwaltung', href: '/admin/quiz', icon: FileText },
    { name: 'Eingaben', href: '/admin/submissions', icon: Inbox },
    { name: 'Auswertungen', href: '/admin/evaluations', icon: BarChart3 },
    { name: 'die Benchmark', href: '/admin/benchmarks', icon: BarChart3 },

  ]

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans">
      {/* Sidebar - Deep Navy Blue */}
      <aside className="relative flex w-72 flex-col border-r border-blue-900/10 bg-[#0B1120] text-slate-300 shadow-2xl transition-all duration-300 ease-in-out">
        
        {/* Logo Section */}
        <div className="flex h-24 items-center justify-center border-b border-white/5 bg-[#0B1120] px-6">
          <Link href="/admin/dashboard" className="group flex items-center gap-2 transition-transform hover:scale-105">
            {/* Ensure your logo works on dark backgrounds, otherwise wrap it in a white div or use a white version */}
            <div className="relative h-12 w-auto">
                <Image
                src="/fit4sale-logo.png"
                alt="Fit4Sale Logo"
                width={140}
                height={50}
                className="object-contain brightness-0 invert" // This CSS makes a black logo white. Remove if logo is already white.
                />
            </div>
          </Link>
        </div>


        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-2">
          <p className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Menu
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="border-t border-white/5 bg-[#080c17] p-4">
          <div className="flex flex-col gap-3">
             <div className="flex items-center gap-3 px-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500"></div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">Administrator</span>
                    <span className="text-xs text-slate-500">Fit4Sale Admin</span>
                </div>
             </div>
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              className="w-full justify-start gap-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Abmelden
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50/50">
        {/* Header Bar for Content (Optional but adds class) */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md">
           <h1 className="text-xl font-semibold text-slate-800 capitalize">
             {pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
           </h1>
           {/* You could add notifications or time here */}
        </header>

        <div className="p-8">
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                {children}
            </div>
        </div>
      </main>
    </div>
  )
}
