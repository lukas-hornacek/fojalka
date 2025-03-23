import { useContext } from "react";
import { CytoscapeContext } from "./CytoscapeContext";

// example button that will be replaced
export default function AddStateButton() {
  const cytoscapeContext = useContext(CytoscapeContext);

  if (!cytoscapeContext) {
    throw new Error("AutomatonWindow must be used within a CytoscapeProvider");
  }

  function addState() {
    cytoscapeContext?.addNode("z", { x: 200, y: 50 });
  }

  return (
    <button onClick={addState}>Add State</button>
  );
}
