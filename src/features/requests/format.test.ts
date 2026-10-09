import { describe, expect, it } from "vitest";
import { formatRequestEvent } from "./format";

describe("request history formatting", () => {
  it("maps workflow identifiers and status transitions to customer-readable text", () => {
    expect(formatRequestEvent({ eventType: "ADMIN_CHANGED_STATUS", fromStatus: "IN_PROGRESS", toStatus: "AWAITING_USER", fromPriority: null, toPriority: null })).toEqual({
      label: "Status changed",
      transition: "In progress → Waiting for customer",
    });
  });

  it("maps priority transitions without exposing raw event names", () => {
    expect(formatRequestEvent({ eventType: "ADMIN_CHANGED_PRIORITY", fromStatus: null, toStatus: null, fromPriority: "MEDIUM", toPriority: "HIGH" })).toEqual({
      label: "Priority changed",
      transition: "Medium → High",
    });
  });
});
