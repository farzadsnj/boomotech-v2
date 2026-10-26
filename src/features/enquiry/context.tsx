"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { EnquiryContext } from "./types";

type EnquiryContextValue = {
  context: EnquiryContext;
  updateContext: (next: Partial<EnquiryContext>) => void;
  replaceContext: (next: EnquiryContext) => void;
  clearContext: () => void;
};

const Context = createContext<EnquiryContextValue | null>(null);

export function EnquiryContextProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<EnquiryContext>({});
  const updateContext = useCallback((next: Partial<EnquiryContext>) => setContext((current) => ({ ...current, ...next })), []);
  const replaceContext = useCallback((next: EnquiryContext) => setContext(next), []);
  const clearContext = useCallback(() => setContext({}), []);
  const value = useMemo<EnquiryContextValue>(() => ({
    context, updateContext, replaceContext, clearContext,
  }), [clearContext, context, replaceContext, updateContext]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useEnquiryContext() {
  const value = useContext(Context);
  if (!value) throw new Error("useEnquiryContext must be used inside EnquiryContextProvider");
  return value;
}
