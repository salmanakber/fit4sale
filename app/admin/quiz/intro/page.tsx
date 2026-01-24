'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

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
    return <p className="text-foreground/60">Loading...</p>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Intro Screen</h1>
          <p className="text-foreground/60 mt-2">
            Customize the welcome screen that users see before starting the quiz
          </p>
        </div>
        <Link href="/admin/quiz">
          <Button variant="outline">Back to Questions</Button>
        </Link>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Title
          </label>
          <Input
            value={settings.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g., Fit4Sale Fitness Assessment"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Description
          </label>
          <Textarea
            value={settings.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Brief description of the assessment"
            rows={3}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Estimated Time to Complete
          </label>
          <Input
            value={settings.estimated_time}
            onChange={(e) => handleChange('estimated_time', e.target.value)}
            placeholder="e.g., 8-10 minutes"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Button Text
          </label>
          <Input
            value={settings.button_text}
            onChange={(e) => handleChange('button_text', e.target.value)}
            placeholder="e.g., Start Assessment"
            className="w-full"
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Preview</h3>
          <Card className="bg-background p-8 border-muted">
            <div className="space-y-6 text-center">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-4">
                  {settings.title}
                </h1>
                <p className="text-lg text-foreground/80 mb-6">
                  {settings.description}
                </p>
              </div>

              <div className="bg-secondary/30 rounded-lg p-6">
                <p className="text-sm text-foreground/70 mb-2">Estimated Time</p>
                <p className="text-2xl font-semibold text-primary">
                  {settings.estimated_time}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex gap-3 pt-6 border-t">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Link href="/admin/quiz" className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              Cancel
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
