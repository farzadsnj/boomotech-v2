export const PTE_RETURN_PATH = "/learning/pte-academic";

export function validatedReturnPath(value: string | null | undefined) {
  if (!value || value.length > 240 || value.includes("\\") || value.includes("%") || value.startsWith("//")) return undefined;
  try {
    const parsed = new URL(value, "https://boomotech.local");
    if (parsed.origin !== "https://boomotech.local" || parsed.username || parsed.password || parsed.hash) return undefined;
    if (parsed.pathname !== PTE_RETURN_PATH && !parsed.pathname.startsWith(`${PTE_RETURN_PATH}/`)) return undefined;
    return `${parsed.pathname}${parsed.search}`;
  } catch { return undefined; }
}

export function authHref(path: "/login" | "/register" | "/check-email" | "/forgot-password", returnTo?: string) {
  const safe = validatedReturnPath(returnTo);
  if (!safe) return path;
  const params = new URLSearchParams({ returnTo: safe });
  return `${path}?${params.toString()}`;
}
