import { useContext } from "react";
import { CoreContext } from "../core/CoreContext";

export default function AlgorithmButtons() {
  const coreContext = useContext(CoreContext);

  if (!coreContext) {
    throw new Error("Algorithms must be used within a CoreProvider");
  }

  function algorithmNext() {
    const e = coreContext!.algorithmNext();
    if (e !== undefined) {
        alert(e.details);
    }
  }

  function algorithmUndo() {
    const e = coreContext!.algorithmUndo();
    if (e !== undefined) {
        alert(e.details);
    }
  }

  function algorithmTransform() {
    const e = coreContext!.transform();
    if (e !== undefined) {
        alert(e.details);
    }
  }

  function algorithmEnd() {
    const e = coreContext!.algorithmDelete(true);
    if (e !== undefined) {
        alert(e.details);
    }
  }

  return (
    <>
      <div className="row">
        <div className="col">
          <div className="stack gap">
            <button className="btn btn-primary" onClick={algorithmNext}>Next step</button>
            <button className="btn btn-primary" onClick={algorithmUndo}>Undo step</button>

            <button className="btn btn-primary" onClick={algorithmTransform}>Skip to the end</button>
            <button className="btn btn-primary" onClick={algorithmEnd}>End algorithm</button>
          </div>
        </div>
      </div>
    </>
  );
}