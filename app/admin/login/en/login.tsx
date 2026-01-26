'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'

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
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
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
        router.push('/admin/dashboard')
      } else {
        const data = await response.json()
        setGeneralError(data.error || 'Login failed. Please try again.')
      }
    } catch (error) {
      console.error('[v0] Login error:', error)
      setGeneralError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10 px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Admin Login</h1>
          <p className="text-muted-foreground">
            Sign in to access the Fit4Sale admin dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <FieldSet className="gap-6">
            {generalError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {generalError}
              </div>
            )}

            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: undefined }))
                    }
                  }}
                  placeholder="admin@fit4sale.com"
                  disabled={isLoading}
                />
                {errors.email && <FieldError>{errors.email}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: undefined }))
                    }
                  }}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                {errors.password && <FieldError>{errors.password}</FieldError>}
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </FieldSet>
        </form>

        <div className="mt-6 border-t border-border pt-6 text-center text-sm">
          <p className="text-muted-foreground">
            Not an admin?{' '}
            <Link href="/" className="font-medium text-primary hover:underline">
              Go to survey
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
