"use client";

import React, { ReactNode } from "react";

// Export everything from the new context
export { 
  CoworkProvider,
  useCoworkContext,
  useCoworkContextOptional,
  withCoworkContext,
  useCoworkChangeListener
} from "@/contexts/cowork-context";

// Legacy provider wrapper for backward compatibility
interface LegacyCoworkProviderProps {
  children: ReactNode;
}

export function LegacyCoworkProvider({ children }: LegacyCoworkProviderProps) {
  // This is now just a wrapper that imports the new provider
  const { CoworkProvider } = require("@/contexts/cowork-context");
  
  return (
    <CoworkProvider autoFetch={true} persistActiveCowork={true}>
      {children}
    </CoworkProvider>
  );
}