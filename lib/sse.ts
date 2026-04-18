export async function parseSse(
  response: Response,
  onEvent: (data: any) => void,
  signal?: AbortSignal
): Promise<void> {
  if (!response.body) throw new Error('Response has no body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      if (signal?.aborted) {
        try {
          await reader.cancel();
        } catch {
          // ignore
        }
        return;
      }
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // SSE separates events with \n\n
      let sepIdx;
      while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, sepIdx);
        buffer = buffer.slice(sepIdx + 2);
        const dataLines: string[] = [];
        for (const line of rawEvent.split('\n')) {
          if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trimStart());
          }
        }
        if (dataLines.length === 0) continue;
        const payload = dataLines.join('\n');
        if (payload === '[DONE]') continue;
        try {
          onEvent(JSON.parse(payload));
        } catch {
          // Not JSON — emit as plain text event
          onEvent({ type: 'text', delta: payload });
        }
      }
    }
    // Flush trailing buffer if any
    if (buffer.trim().length > 0) {
      const dataLines: string[] = [];
      for (const line of buffer.split('\n')) {
        if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
      }
      if (dataLines.length) {
        const payload = dataLines.join('\n');
        if (payload !== '[DONE]') {
          try {
            onEvent(JSON.parse(payload));
          } catch {
            onEvent({ type: 'text', delta: payload });
          }
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
  }
}
