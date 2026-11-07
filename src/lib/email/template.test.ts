import { describe, expect, it } from "vitest";
import { approvedEmailUrl, renderBrandedEmail } from "./template";

describe("BoomoTech email template", () => {
  it("renders equivalent branded HTML and plain text while escaping customer content", () => {
    const result = renderBrandedEmail({
      approvedOrigin: "https://boomotech.com.au",
      preheader: "A safe preview",
      heading: "We’ve received your request",
      greeting: "Hi A very long <Customer> name that remains readable,",
      introduction: "Your request is ready for review.",
      fields: [{ label: "Service", value: "A long service label with <markup>" }],
      message: { label: "Message", value: "First line\n<script>alert(1)</script>\nAReallyLongUnbrokenWordThatMustWrapAcrossEmailClients" },
      action: { label: "View request", url: "https://boomotech.com.au/dashboard?request=BT-123#request-BT-123" },
      safety: "Do not send passwords by email.",
    });
    expect(result.html).toContain("background:#102F3D");
    expect(result.html).toContain("background:#0070B7");
    expect(result.html).toContain("&lt;script&gt;");
    expect(result.html).not.toContain("<script>alert(1)</script>");
    expect(result.html).toContain("<br>");
    expect(result.text).toContain("First line\n<script>alert(1)</script>");
    expect(result.text).toContain("View request: https://boomotech.com.au/dashboard");
  });

  it("rejects action links outside the approved origin", () => {
    expect(() => approvedEmailUrl("https://example.com/token", "https://boomotech.com.au")).toThrow(/approved application origin/);
  });
});
