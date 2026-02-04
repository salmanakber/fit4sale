'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AdminSettingsPage() {
  const router = useRouter()
  const { data: settings, isLoading, mutate } = useSWR('/api/admin/settings', fetcher)
  const [formData, setFormData] = useState({
    admin_name: '',
    password: '',
    resend_api_key: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        admin_name: settings.admin_name || '',
        resend_api_key: settings.resend_api_key || '',
      }))
    }
  }, [settings])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to update settings' })
        return
      }

      setMessage({ type: 'success', text: 'Settings updated successfully!' })
      setFormData(prev => ({ ...prev, password: '' }))
      mutate()
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' })
      console.error('Error updating settings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-gray-600 mt-1">Manage your admin profile and API keys</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Profile & API Configuration</CardTitle>
          <CardDescription>Update your admin details and API credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="admin_name" className="block text-sm font-medium text-gray-900 mb-2">
                Admin Name
              </label>
              <Input
                id="admin_name"
                name="admin_name"
                type="text"
                placeholder="Enter admin name"
                value={formData.admin_name}
                onChange={handleChange}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                Password <span className="text-gray-500 text-xs font-normal">(Leave blank to keep current)</span>
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter new password (optional)"
                value={formData.password}
                onChange={handleChange}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="resend_api_key" className="block text-sm font-medium text-gray-900 mb-2">
                Resend API Key
              </label>
              <Input
                id="resend_api_key"
                name="resend_api_key"
                type="password"
                placeholder="Enter your Resend API key"
                value={formData.resend_api_key}
                onChange={handleChange}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from{' '}
                <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">
                  resend.com
                </a>
              </p>
            </div>

            {message && (
              <div
                className={`p-3 rounded-md text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {message.text}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
