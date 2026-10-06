import { describe, expect, it } from "vitest";
import { readLimitedJson } from "./json-body";

describe("limited JSON body reader", () => {
  it("accepts bounded JSON and rejects unsupported types", async () => {
    await expect(readLimitedJson(new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: '{"ok":true}' }))).resolves.toEqual({ ok: true });
    await expect(readLimitedJson(new Request("http://localhost", { method: "POST", headers: { "content-type": "text/plain" }, body: "text" }))).rejects.toMatchObject({ status: 415 });
  });

  it("cancels a streamed request once its decoded size exceeds the limit", async () => {
    let cancelled = false; let sent = 0; const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({ pull(controller) { controller.enqueue(encoder.encode("x".repeat(7000))); sent += 1; if (sent === 3) controller.close(); }, cancel() { cancelled = true; } });
    const request = new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: stream, duplex: "half" } as RequestInit & { duplex: "half" });
    await expect(readLimitedJson(request, 12_000)).rejects.toMatchObject({ status: 413 });
    expect(cancelled).toBe(true);
    expect(sent).toBe(2);
  });
});
