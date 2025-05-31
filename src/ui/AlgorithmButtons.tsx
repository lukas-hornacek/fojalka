import { useContext } from "react";
import { CoreContext } from "../core/CoreContext";
import { Dropdown, DropdownButton, Stack } from "react-bootstrap";

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

  function algorithmClose(keepSecondary: boolean) {
    const e = coreContext!.algorithmDelete(keepSecondary);
    if (e !== undefined) {
      alert(e.details);
    }
  }

  return (
    <>
      <div className="row">
        <div className="col">
          <Stack direction="horizontal" gap={3}>
            <button className="btn btn-primary" onClick={algorithmNext}>Next step</button>
            <button className="btn btn-primary" onClick={algorithmUndo}>Undo step</button>
            <button className="btn btn-primary" onClick={algorithmTransform}>Skip to the end</button>
            
            <DropdownButton id="dropdown-algorithm-button" title="Close algorithm">
              <Dropdown.Item onClick={() => algorithmClose(false)}>Keep first window</Dropdown.Item>
              <Dropdown.Item onClick={() => algorithmClose(true)}>Keep second window</Dropdown.Item>
            </DropdownButton>
          </Stack>
        </div>
      </div>
    </>
  );
}
