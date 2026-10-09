import OpenAI from "openai";
import { boomotechKnowledge } from "./knowledge";
import type { ChatRequest } from "./chat-schema";
import { isAiChatEnabled } from "@/lib/config/features";

const DEFAULT_MODEL = "gpt-6-luna";
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_OUTPUT_TOKENS = 350;

export class ChatConfigurationError extends Error {}
export class ChatProviderError extends Error {}

type ResponsesClient = Pick<OpenAI, "responses">;

export function getChatModel() {
  return process.env.OPENAI_CHAT_MODEL?.trim() || DEFAULT_MODEL;
}

function instructions() {
  return `You are the BoomoTech website service assistant. Use only the public website knowledge below.

Answer in clear Australian English and keep the answer concise (usually 2-4 short paragraphs). Help the visitor choose a relevant service or safe next step. When relevant, name at most three services and include their exact website paths in plain text. Do not diagnose a technical fault with certainty. Do not invent prices, response times, availability, service areas, credentials, partnerships, guarantees or policies. Never ask for or accept passwords, MFA codes, recovery keys, private encryption keys, payment-card information, API keys or confidential customer data. If the question needs account-specific investigation, sensitive data, emergency assistance, legal advice or information absent from the knowledge, clearly state the limit and direct the visitor to the appropriate website guidance or consultation request. A consultation request is not a confirmed appointment.

${boomotechKnowledge}`;
}

export async function generateChatResponse(
  request: ChatRequest,
  client?: ResponsesClient,
) {
  if (!isAiChatEnabled()) throw new ChatConfigurationError("AI chat is disabled.");
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!client && !apiKey) throw new ChatConfigurationError("OpenAI is not configured.");

  const openai = client ?? new OpenAI({
    apiKey,
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: 0,
  });

  try {
    const response = await openai.responses.create({
      model: getChatModel(),
      instructions: instructions(),
      input: [
        ...request.history.map((item) => ({ role: item.role, content: item.content })),
        { role: "user" as const, content: request.message },
      ],
      max_output_tokens: MAX_OUTPUT_TOKENS,
      store: false,
    });
    const answer = response.output_text?.trim();
    if (!answer) throw new ChatProviderError("The response was empty.");
    return answer;
  } catch (error) {
    if (error instanceof ChatProviderError) throw error;
    throw new ChatProviderError("The chat provider request failed.");
  }
}
