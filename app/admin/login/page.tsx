'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const router = useRouter()

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!email.trim()) {
      newErrors.email = 'Email ist erforderlich'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Bitte geben Sie eine gültige Email ein'
    }

    if (!password) {
      newErrors.password = 'Passwort ist erforderlich'
    } else if (password.length < 6) {
      newErrors.password = 'Passwort muss mindestens 6 Zeichen lang sein'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        // const data = await response.json() // Not needed unless used
        router.push('/admin/dashboard')
      } else {
        const data = await response.json()
        setGeneralError(data.error || 'Login fehlgeschlagen. Bitte prüfen Sie Ihre Daten.')
      }
    } catch (error) {
      console.error('[v0] Login error:', error)
      setGeneralError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      
      {/* LEFT COLUMN: Branding (Navy Blue) */}
      <div className="relative hidden h-full flex-col bg-slate-900 p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-blue-900/20" /> {/* Subtle overlay */}
        
        {/* Logo Area */}
        <div className="relative z-20 flex items-center text-lg font-medium">
             <Image
              src="/fit4sale-logo.png"
              alt="Fit4Sale Logo"
              width={160}
              height={60}
              className="object-contain brightness-0 invert" // Forces black logo to be white
            />
        </div>

        {/* Branding Content */}
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Verwalten Sie Fitness-Assessments, Kundenanalysen und Quiz-Ergebnisse zentral an einem Ort.&rdquo;
            </p>
            <footer className="text-sm text-slate-400">Admin Konsole v2.0</footer>
          </blockquote>
        </div>
      </div>

      {/* RIGHT COLUMN: Form (White) */}
      <div className="lg:p-8 h-full flex items-center justify-center bg-slate-50/50">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          
          <div className="flex flex-col space-y-2 text-center">
            {/* Mobile Logo (only visible on small screens) */}
            <div className="lg:hidden flex justify-center mb-4">
                 <Image
                    src="/fit4sale-logo.png"
                    alt="Fit4Sale Logo"
                    width={120}
                    height={50}
                    className="object-contain"
                />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-blue-950">
              Willkommen zurück
            </h1>
            <p className="text-sm text-slate-500">
              Geben Sie Ihre Zugangsdaten ein, um fortzufahren.
            </p>
          </div>

          <div className="grid gap-6">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                
                {/* General Error Alert */}
                {generalError && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                    <ShieldCheck className="h-4 w-4" />
                    {generalError}
                  </div>
                )}

                {/* Email Input */}
                <div className="grid gap-2">
                  <Label htmlFor="email" className="sr-only">Email</Label>
                  <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        placeholder="name@example.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        disabled={isLoading}
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value)
                            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                        }}
                        className={cn("pl-10 bg-white", errors.email && "border-red-500 focus-visible:ring-red-500")}
                      />
                  </div>
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                {/* Password Input */}
                <div className="grid gap-2">
                  <Label htmlFor="password" className="sr-only">Passwort</Label>
                  <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="password"
                        placeholder="Passwort"
                        type="password"
                        autoCapitalize="none"
                        autoComplete="current-password"
                        disabled={isLoading}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                        }}
                        className={cn("pl-10 bg-white", errors.password && "border-red-500 focus-visible:ring-red-500")}
                      />
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>

                <Button disabled={isLoading} className="bg-blue-900 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20">
                  {isLoading ? (
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                     <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Anmelden
                </Button>

              </div>
            </form>
          </div>

          <p className="px-8 text-center text-sm text-slate-500">
            <Link href="/" className="hover:text-blue-600 underline underline-offset-4">
              Zurück zur Startseite
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
