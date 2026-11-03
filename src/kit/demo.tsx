import React, { createContext, useContext } from 'react';

/** Vrai tant que les chiffres affichés ne viennent pas d’une base réelle configurée. */
const Ctx = createContext(true);

export function DemoModeProvider({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemoMode(): boolean {
  return useContext(Ctx);
}
