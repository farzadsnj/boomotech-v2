import { getSiteUrl } from "@/lib/site-url";

export function hasApprovedMutationOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const approved = new Set([getSiteUrl().origin]);
  if (process.env.NODE_ENV !== "production") {
    approved.add(new URL(request.url).origin);
    approved.add("http://localhost:3000");
    approved.add("http://localhost:3100");
    approved.add("http://127.0.0.1:3000");
    approved.add("http://127.0.0.1:3100");
  }
  return approved.has(origin);
}
