import React, { createContext } from "react";
import { Core, ICore } from "./core";

export const CoreContext = createContext<ICore | undefined>(undefined);

export const CoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  <CoreContext.Provider value={new Core()}>
    {children}
  </CoreContext.Provider>;
