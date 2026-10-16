/**
 * Verified public identity facts. Keep unknown operational details null until
 * the owner confirms them; null values are never rendered or placed in schema.
 */
export const businessIdentity = {
  tradingName: "BoomoTech",
  founderName: "Farzad Sanjarani",
  baseLocality: "Brisbane",
  baseRegion: "Queensland",
  remoteArea: "Australia",
  legalName: null as string | null, // TODO(owner): confirm registered legal entity.
  abn: null as string | null, // TODO(owner): confirm public ABN before display.
  publicEmail: null as string | null, // TODO(owner): approve monitored public address.
  publicPhone: null as string | null, // TODO(owner): approve public phone number.
  streetAddress: null as string | null, // TODO(owner): publish only if this is a public office.
  publicHours: null as string | null, // TODO(owner): confirm staffed contact hours.
  onsiteServiceArea: null as string | null, // TODO(owner): confirm radius and travel terms.
} as const;
