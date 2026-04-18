'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Eye, EyeOff, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type KeyField = {
  id: string;
  label: string;
  placeholder: string;
  hint: string;
  envVar: string;
};

const FIELDS: KeyField[] = [
  {
    id: 'anthropic',
    label: 'Anthropic API key',
    placeholder: 'sk-ant-...',
    hint: 'Powers the chat + brand-brain reasoning.',
    envVar: 'ANTHROPIC_API_KEY'
  },
  {
    id: 'firecrawl',
    label: 'Firecrawl API key',
    placeholder: 'fc-...',
    hint: 'Used to scrape your website and inspiration profiles.',
    envVar: 'FIRECRAWL_API_KEY'
  },
  {
    id: 'x_client_id',
    label: 'X (Twitter) Client ID',
    placeholder: 'client id from developer.x.com',
    hint: 'Required to publish drafts to X.',
    envVar: 'X_CLIENT_ID'
  },
  {
    id: 'x_client_secret',
    label: 'X (Twitter) Client Secret',
    placeholder: 'client secret',
    hint: 'Paired with the X Client ID.',
    envVar: 'X_CLIENT_SECRET'
  }
];

const STORAGE_KEY = 'zeitgeist.apiKeys';

function loadKeys(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export default function SettingsPage() {
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [reveal, setReveal] = React.useState<Record<string, boolean>>({});
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    setValues(loadKeys());
  }, []);

  function updateValue(id: string, v: string) {
    setValues((prev) => ({ ...prev, [id]: v }));
    setSaved(false);
  }

  function toggleReveal(id: string) {
    setReveal((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2400);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="h-4 w-px bg-border" />
          <img src="/logo.png" alt="Zeitgeist" className="h-7 w-auto" />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Key className="h-3.5 w-3.5" />
          API keys
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Bring your own keys. Stored locally in your browser — nothing is shipped to our servers from this page.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6 rounded-xl border border-border bg-background p-6 shadow-sm">
          {FIELDS.map((field) => {
            const isRevealed = reveal[field.id] ?? false;
            return (
              <div key={field.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <Label htmlFor={field.id} className="text-sm font-medium text-foreground">
                    {field.label}
                  </Label>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {field.envVar}
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id={field.id}
                    type={isRevealed ? 'text' : 'password'}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={field.placeholder}
                    value={values[field.id] ?? ''}
                    onChange={(e) => updateValue(field.id, e.target.value)}
                    className="pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => toggleReveal(field.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label={isRevealed ? 'Hide' : 'Reveal'}
                  >
                    {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{field.hint}</p>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {saved ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                  Saved
                </span>
              ) : (
                'Keys never leave your browser.'
              )}
            </span>
            <Button type="submit">Save keys</Button>
          </div>
        </form>

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Need keys? Grab them at{' '}
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
            console.anthropic.com
          </a>
          ,{' '}
          <a href="https://firecrawl.dev" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
            firecrawl.dev
          </a>
          , and{' '}
          <a href="https://developer.x.com" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
            developer.x.com
          </a>
          .
        </p>
      </main>
    </div>
  );
}
