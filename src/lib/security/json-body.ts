export class RequestBodyError extends Error {
  constructor(public readonly status: 400 | 413 | 415) { super(String(status)); }
}

export async function readLimitedJson(request: Request, maxBytes = 12_000): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new RequestBodyError(415);
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new RequestBodyError(413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestBodyError(400);
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) { await reader.cancel().catch(() => undefined); throw new RequestBodyError(413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new RequestBodyError(400); }
}
