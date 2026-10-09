import { describe, expect, it } from "vitest";
import { isAiChatEnabled, isShopEnabled } from "./features";

describe("production feature flags", () => {
  it("keeps incomplete public features disabled by default", () => {
    expect(isAiChatEnabled({})).toBe(false);
    expect(isShopEnabled({})).toBe(false);
  });

  it("requires an explicit true value", () => {
    expect(isAiChatEnabled({ OPENAI_CHAT_ENABLED: "TRUE" })).toBe(true);
    expect(isShopEnabled({ SHOP_ENABLED: " true " })).toBe(true);
    expect(isAiChatEnabled({ OPENAI_CHAT_ENABLED: "1" })).toBe(false);
  });
});
