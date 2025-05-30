import { useContext } from "react";
import { CoreContext } from "../core/CoreContext";
import { Kind, Mode } from "../core/core";

export default function ToggleWindow() {
  const coreContext = useContext(CoreContext);
  const switchMode = () => {
    if (coreContext == undefined) {
      return;
    }
    const core = coreContext.primary;
    if (core.kind == Kind.AUTOMATON) {
      core?.addState("a", { x: 50, y:0 });
      core?.addState("b", { x: 100, y:0 });
      core?.addState("c", { x: 200, y:0 });
      core?.addEdge("q₀", "a", { id: "", inputChar:"a" });
      core?.addEdge("a", "b", { id: "", inputChar:"a" });
      core?.addEdge("b", "c", { id: "", inputChar:"a" });
    }
    if (coreContext?.mode.mode === Mode.VISUAL) {
      coreContext?.switchToEditMode(false);
      console.log("Switched to EDIT mode");
    } else if (coreContext?.mode.mode === Mode.EDIT) {
      coreContext?.switchToVisualMode();
      console.log("Switched to VISUAL mode");
    }
  };

  if (!coreContext) {
    throw new Error("SwitchWindow must be used within a CoreProvider");
  }

  return (
    <button className="btn btn-primary" onClick={switchMode}>Switch mode</button>
  );
}
