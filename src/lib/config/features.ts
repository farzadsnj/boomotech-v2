const enabled = (value: string | undefined) => value?.trim().toLowerCase() === "true";

export function isAiChatEnabled(environment: Record<string, string | undefined> = process.env) {
  return enabled(environment.OPENAI_CHAT_ENABLED);
}

export function isShopEnabled(environment: Record<string, string | undefined> = process.env) {
  return enabled(environment.SHOP_ENABLED);
}
