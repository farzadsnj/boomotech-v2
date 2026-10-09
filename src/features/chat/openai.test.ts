import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatConfigurationError, generateChatResponse, getChatModel } from "./openai";

describe("OpenAI chat adapter", () => {
  beforeEach(() => { process.env.OPENAI_CHAT_ENABLED = "true"; });
  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_CHAT_MODEL;
    delete process.env.OPENAI_CHAT_ENABLED;
  });

  it("requires a server-side API key when no client is injected", async () => {
    await expect(generateChatResponse({ message: "Help with Wi-Fi", history: [] })).rejects.toBeInstanceOf(ChatConfigurationError);
  });

  it("uses the Responses API with bounded conversation input and no storage", async () => {
    const create = vi.fn().mockResolvedValue({ output_text: "Network and Wi-Fi may be relevant." });
    const answer = await generateChatResponse({
      message: "Our office Wi-Fi is unreliable",
      history: [{ role: "assistant", content: "How can I help?" }],
    }, { responses: { create } } as never);

    expect(answer).toBe("Network and Wi-Fi may be relevant.");
    expect(create).toHaveBeenCalledOnce();
    const request = create.mock.calls[0][0];
    expect(request.store).toBe(false);
    expect(request.max_output_tokens).toBe(350);
    expect(request.instructions).toContain("SERVICE: Network and Wi-Fi");
    expect(request.instructions).toContain("Never ask for or accept passwords");
    expect(request.input).toEqual([
      { role: "assistant", content: "How can I help?" },
      { role: "user", content: "Our office Wi-Fi is unreliable" },
    ]);
  });

  it("uses an environment model override without exposing the API key", async () => {
    process.env.OPENAI_CHAT_MODEL = "approved-model";
    process.env.OPENAI_API_KEY = "server-secret-value";
    expect(getChatModel()).toBe("approved-model");
    const create = vi.fn().mockResolvedValue({ output_text: "A safe response." });
    await generateChatResponse({ message: "What do you offer?", history: [] }, { responses: { create } } as never);
    expect(JSON.stringify(create.mock.calls)).not.toContain("server-secret-value");
  });
});
