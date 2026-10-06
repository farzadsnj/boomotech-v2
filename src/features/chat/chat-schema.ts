import { z } from "zod";

export const CHAT_MESSAGE_MAX_LENGTH = 1_500;
export const CHAT_HISTORY_MAX_ITEMS = 8;

const chatText = z.string().trim().min(1).max(CHAT_MESSAGE_MAX_LENGTH);

export const chatHistoryItemSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: chatText,
}).strict();

export const chatRequestSchema = z.object({
  message: chatText,
  history: z.array(chatHistoryItemSchema).max(CHAT_HISTORY_MAX_ITEMS).default([]),
}).strict();

export type ChatHistoryItem = z.infer<typeof chatHistoryItemSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
