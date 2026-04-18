'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

export function Composer({
  onSubmit,
  disabled,
  placeholder
}: {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = React.useState('');
  const taRef = React.useRef<HTMLTextAreaElement | null>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSubmit(text);
    setValue('');
  };

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Textarea
        ref={taRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? 'Type a message… (Enter to send, Shift+Enter for newline)'}
        rows={2}
        disabled={disabled}
        className="min-h-[44px] resize-none bg-background"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <Button type="submit" size="icon" disabled={disabled || !value.trim()} aria-label="Send">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
