import { useEffect, useContext } from "react";
import { Kind } from "../core/core";
import { TestingAlgorithm } from "../engine/algorithm/algorithm";
import { PRIMARY_CYTOSCAPE_ID, SECONDARY_CYTOSCAPE_ID } from "../constants";
import { CoreContext } from "./EditButtons";

export default function AutomatonWindow({ primary, cols }: { primary: boolean, cols: number }) {
  const coreContext = useContext(CoreContext);

  if (!coreContext) {
    throw new Error("AutomatonWindow must be used within a CoreProvider");
  }

  useEffect(() => {
    if (primary && coreContext.primary.kind === Kind.AUTOMATON) {
      coreContext.primary.init();
    } else if (!primary) {
      coreContext.algorithmStart(new TestingAlgorithm());
      if (coreContext.secondary?.kind === Kind.AUTOMATON) {
        coreContext.secondary.init();
      }
    } else {
      throw new Error("AutomatonWindow could not be initialized correctly");
    }
  }, [primary, coreContext]);

  return (
    <div className={`col-${cols}`}>
      <div id={primary ? PRIMARY_CYTOSCAPE_ID : SECONDARY_CYTOSCAPE_ID}></div>
    </div>
  );
}
