import { describe, expect, it } from "vitest";
import { bookingRequestSchema } from "./booking-schema";

const valid = { fullName: "Taylor Smith", email: "Taylor@Example.com", phone: "+61 400 000 000", servicePath: "/services/it-support", message: "We need help with several office computers.", consent: true, website: "" };
describe("booking request schema", () => {
  it("normalises an accepted request", () => { const result = bookingRequestSchema.parse(valid); expect(result.email).toBe("taylor@example.com"); expect(result.phone).toBe("+61400000000"); });
  it("requires consent", () => { expect(bookingRequestSchema.safeParse({ ...valid, consent: false }).success).toBe(false); });
  it("rejects unknown services and invalid contact fields", () => { expect(bookingRequestSchema.safeParse({ ...valid, servicePath: "/fake", email: "bad" }).success).toBe(false); });
  it("rejects the honeypot when filled", () => { expect(bookingRequestSchema.safeParse({ ...valid, website: "spam" }).success).toBe(false); });
});
