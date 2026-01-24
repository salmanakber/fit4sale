'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  LayoutTemplate, 
  Clock, 
  Loader2,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntroSettings {
  id?: string;
  title: string;
  description: string;
  estimated_time: string;
  button_text: string;
}

export default function IntroEditorPage() {
  const [settings, setSettings] = useState<IntroSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchIntroSettings();
  }, []);

  const fetchIntroSettings = async () => {
    try {
      const response = await fetch('/api/admin/quiz/intro');
      if (!response.ok) throw new Error('Failed to fetch intro settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching intro settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof IntroSettings, value: string) => {
    if (settings) {
      setSettings({
        ...settings,
        [field]: value,
      });
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/quiz/intro', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save intro settings');
      alert('Intro settings saved successfully!');
    } catch (error) {
      console.error('Error saving intro settings:', error);
      alert('Failed to save intro settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col gap-4 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
        <p>Einstellungen werden geladen...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link 
          href="/admin/quiz" 
          className="group flex w-fit items-center text-sm font-medium text-slate-500 transition-colors hover:text-blue-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Zurück zur Übersicht
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-950 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <LayoutTemplate className="h-6 w-6" />
              </span>
              Startbildschirm Editor
            </h1>
            <p className="mt-2 text-slate-500 text-lg">
              Passen Sie den Begrüßungsbildschirm an, den Nutzer vor dem Start sehen.
            </p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="bg-blue-900 hover:bg-blue-800 text-white min-w-[140px] shadow-lg shadow-blue-900/20"
          >
            {saving ? (
               <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Speichert...</>
            ) : (
               <><Save className="mr-2 h-4 w-4" /> Speichern</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* LEFT COLUMN: Editor Form */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-sm font-bold uppercase tracking-wide text-slate-500 border-b border-slate-100 pb-2">
              Inhalt bearbeiten
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-500">
                  Titel / Überschrift
                </label>
                <Input
                  value={settings.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="z.B. Fit4Sale Gesundheits-Check"
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-500">
                  Beschreibung
                </label>
                <Textarea
                  value={settings.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Beschreiben Sie kurz, worum es geht..."
                  rows={5}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500 resize-none"
                />
                <p className="text-xs text-slate-400 text-right">
                  {settings.description.length} Zeichen
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-slate-500">
                    Geschätzte Zeit
                    </label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                        value={settings.estimated_time}
                        onChange={(e) => handleChange('estimated_time', e.target.value)}
                        placeholder="z.B. 5-10 Minuten"
                        className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-slate-500">
                    Button Text
                    </label>
                    <Input
                    value={settings.button_text}
                    onChange={(e) => handleChange('button_text', e.target.value)}
                    placeholder="Start Button Label"
                    className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                    />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Preview */}
        <div className="relative">
             <div className="sticky top-6">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 flex items-center gap-2">
                        <Smartphone className="h-4 w-4" /> Live Vorschau
                    </h2>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        Mobile View
                    </span>
                </div>

                {/* Simulated Phone/Card Container */}
                <div className="mx-auto overflow-hidden rounded-[2rem] border-[8px] border-slate-800 bg-slate-900 shadow-2xl max-w-sm">
                    {/* Screen Content */}
                    <div className="flex h-[600px] flex-col items-center justify-center bg-white p-6 text-center">
                        
                        {/* Logo Placeholder */}
                        <div className="mb-8 h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                             <div className="text-xs font-bold text-slate-300">LOGO</div>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center w-full">
                            <h1 className="mb-4 text-2xl font-bold leading-tight text-slate-900">
                                {settings.title || 'Ihr Titel hier'}
                            </h1>
                            
                            <p className="mb-8 text-sm leading-relaxed text-slate-500">
                                {settings.description || 'Ihre Beschreibung erscheint hier...'}
                            </p>

                            <div className="mb-8 flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                                <Clock className="h-4 w-4" />
                                <span>{settings.estimated_time || '0 Min'}</span>
                            </div>
                        </div>

                        <div className="w-full pt-4">
                            <button className="w-full rounded-xl bg-blue-600 py-4 text-base font-semibold text-white shadow-lg shadow-blue-200 transition-transform active:scale-95">
                                {settings.button_text || 'Starten'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <p className="mt-4 text-center text-xs text-slate-400">
                    Dies ist eine Simulation. Das tatsächliche Design kann je nach Nutzergerät variieren.
                </p>
             </div>
        </div>

      </div>
    </div>
  );
}