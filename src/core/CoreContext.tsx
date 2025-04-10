import React, { createContext } from "react";
import { Core, ICore } from "./core";
import { AutomatonCore } from "./automatonCore";
import { AutomatonType } from "../engine/automaton/automaton";
import { PRIMARY_CYTOSCAPE_ID } from "../constants";

export const CoreContext = createContext<ICore | undefined>(undefined);

export const CoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  <CoreContext.Provider value={new Core(new AutomatonCore(AutomatonType.FINITE, PRIMARY_CYTOSCAPE_ID))}>
    {children}
  </CoreContext.Provider>;
