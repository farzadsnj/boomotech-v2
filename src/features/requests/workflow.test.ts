import { describe, expect, it } from "vitest";
import { adminRequestActionSchema, customerRequestActionSchema } from "./schemas";
import { canTransitionRequest } from "./workflow";

describe("request workflow rules", () => {
  it("allows only the approved status transitions", () => {
    expect(canTransitionRequest("NEW", "IN_PROGRESS")).toBe(true);
    expect(canTransitionRequest("NEW", "RESOLVED")).toBe(true);
    expect(canTransitionRequest("RESOLVED", "IN_PROGRESS")).toBe(true);
    expect(canTransitionRequest("WITHDRAWN", "IN_PROGRESS")).toBe(false);
    expect(canTransitionRequest("IN_PROGRESS", "NEW")).toBe(false);
  });

  it("validates message lengths and strips client-controlled workflow fields", () => {
    expect(customerRequestActionSchema.safeParse({ action: "reply", message: "x" }).success).toBe(false);
    const parsed = customerRequestActionSchema.parse({ action: "edit", description: "A sufficiently detailed customer request update.", status: "RESOLVED", priority: "HIGH", userId: "attacker" });
    expect(parsed).toEqual({ action: "edit", description: "A sufficiently detailed customer request update." });
    expect(adminRequestActionSchema.safeParse({ action: "priority", priority: "MEDIOM" }).success).toBe(false);
  });
});
