import { useEffect, useContext } from "react";
import { Kind } from "../core/core";
import { PRIMARY_CYTOSCAPE_ID, SECONDARY_CYTOSCAPE_ID } from "../constants";
import { CoreContext } from "./App";

export default function AutomatonWindow({ primary }: { primary: boolean }) {
  const coreContext = useContext(CoreContext);

  if (!coreContext) {
    throw new Error("AutomatonWindow must be used within a CoreProvider");
  }

  useEffect(() => {
    if (primary && coreContext.primary.kind === Kind.AUTOMATON) {
      coreContext.primary.init();
    } else if (!primary) {
      if (coreContext.secondary?.kind === Kind.AUTOMATON) {
        coreContext.secondary.init();
      }
    } else {
      throw new Error("AutomatonWindow could not be initialized correctly");
    }
  }, [primary]);
  // removed coreContext from here, because it was causing trouble - init already gets called from import
  // nvm readded it

  return <div id={primary ? PRIMARY_CYTOSCAPE_ID : SECONDARY_CYTOSCAPE_ID}></div>;
}
