import { useEffect, useContext } from "react";
import { CytoscapeContext } from "./CytoscapeContext";

export default function AutomatonWindow() {
  const cytoscapeContext = useContext(CytoscapeContext);

  if (!cytoscapeContext) {
    throw new Error("AutomatonWindow must be used within a CytoscapeProvider");
  }

  const { cy } = cytoscapeContext;

  useEffect(() => {
    if (cy) {
      cy.mount(document.getElementById("cy")!);
    }
  }, [cy]);

  return (
    <div id='cy'></div>
  );
}
