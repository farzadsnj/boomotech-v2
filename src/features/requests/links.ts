export function customerRequestHref(reference: string) {
  const encodedReference = encodeURIComponent(reference);
  return `/dashboard?request=${encodedReference}#request-${encodedReference}`;
}
