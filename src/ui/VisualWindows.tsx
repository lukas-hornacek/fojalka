import { useState } from "react";
import AutomatonWindow from "./AutomatonWindow";
import SimulationControls from "./SimulationControls";
import ToggleWindow from "./ToggleWindow";
import SwitchWindow from "./SwitchWindow";

// component that contains cytoscape windows that are filled with elements by Visual
// handles switching between showing one and two windows at a time
// note: hiding the second window currently removes its contents
export default function VisualWindows() {
  const [showSecondary, setShowSecondary] = useState(false);
  const [cols, setCols] = useState(12);

  const toggle = () => {
    setShowSecondary(!showSecondary);
    setCols(!showSecondary ? 6 : 12);
  };

  return (
    <>
      <ToggleWindow toggle={toggle}/>
      <SwitchWindow />
      <SimulationControls />
      <div id="cy-window" className="d-flex flex-row">
        <AutomatonWindow primary={true} cols={cols} />
        {showSecondary ? <AutomatonWindow primary={false} cols={6} /> : null}
      </div>
    </>
  );
}
