'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

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

  // Login page: render directly, no layout chrome
  if (isLoginPage) {
    return <>{children}</>
  }

  if (isLoadingThis) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
          <p className="text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="flex h-20 items-center justify-center border-b border-border px-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Image
              src="/fit4sale-logo.png"
              alt="Fit4Sale Logo"
              width={140}
              height={140}
              className="object-contain"
            />
            {/* <span className="text-sm font-bold text-primary hidden sm:block">Fit4Sale</span> */}
          </Link>
        </div>

        <nav className="space-y-1 p-4 flex-1">
          <Link href="/admin/dashboard" className="block rounded-lg px-4 py-2 hover:bg-background">
            Dashboard
          </Link>
          <Link href="/admin/quiz" className="block rounded-lg px-4 py-2 hover:bg-background">
            Quiz-Verwaltung
          </Link>
          <Link href="/admin/submissions" className="block rounded-lg px-4 py-2 hover:bg-background">
            Eingaben
          </Link>
          <Link href="/admin/evaluations" className="block rounded-lg px-4 py-2 hover:bg-background">
            Bewertungen
          </Link>
        </nav>

        <div className="border-t border-border p-4">
          <Button onClick={handleLogout} variant="outline" size="sm" className="w-full bg-transparent">
            Abmelden
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
