import { describe, expect, it } from "vitest";
import { bookingRequestSchema } from "./booking-schema";

const valid = { fullName: "Taylor Smith", email: "Taylor@Example.com", phone: "+61 400 000 000", servicePath: "/services/it-support", message: "We need help with several office computers.", consent: true, website: "" };
describe("booking request schema", () => {
  it("normalises an accepted request", () => { const result = bookingRequestSchema.parse(valid); expect(result.email).toBe("taylor@example.com"); expect(result.phone).toBe("+61400000000"); });
  it("requires consent", () => { expect(bookingRequestSchema.safeParse({ ...valid, consent: false }).success).toBe(false); });
  it("rejects unknown services and invalid contact fields", () => { expect(bookingRequestSchema.safeParse({ ...valid, servicePath: "/fake", email: "bad" }).success).toBe(false); });
  it("rejects the honeypot when filled", () => { expect(bookingRequestSchema.safeParse({ ...valid, website: "spam" }).success).toBe(false); });
  it.each([
    ["Australian mobile with spaces", "0400 000 000", "0400000000"],
    ["parentheses and hyphens", "+61 (7) 3123-4567", "+61731234567"],
  ])("accepts and normalises %s", (_label, phone, expected) => {
    expect(bookingRequestSchema.parse({ ...valid, phone }).phone).toBe(expected);
  });
  it.each([
    ["dots only", "........"],
    ["dashes only", "--------"],
    ["letters", "phone number"],
    ["too few digits", "1234567"],
    ["too many digits", "1234567890123456"],
    ["repeated plus", "++61400000000"],
    ["misplaced plus", "61+400000000"],
  ])("rejects %s", (_label, phone) => expect(bookingRequestSchema.safeParse({ ...valid, phone }).success).toBe(false));
});
