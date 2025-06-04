import { useContext } from "react";
import { Dropdown, DropdownButton, Stack } from "react-bootstrap";
import { Running } from "./VisualButtons";
import { CoreContext } from "../App";

export default function AlgorithmButtons({ setButtonSet }: { setButtonSet: React.Dispatch<React.SetStateAction<Running>> }) {
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

  //TODO - tu treba doplnit zatvorenie okien
  function algorithmClose(keepSecondary: boolean) {
    const e = coreContext!.algorithmDelete(keepSecondary);
    if (e !== undefined) {
      alert(e.details);
    }
    setButtonSet(Running.NOTHING);
  }

  return (
    <>
      <div className="row">
        <div className="col">
          <Stack direction="horizontal" gap={3}>
            <button className="btn btn-primary m-1" onClick={algorithmNext}>Next step</button>
            <button className="btn btn-primary m-1" onClick={algorithmUndo}>Undo step</button>
            <button className="btn btn-primary m-1" onClick={algorithmTransform}>Skip to the end</button>
            {coreContext.secondary === undefined ? <button className="btn btn-primary m-1" onClick={() => algorithmClose(false)}>Close algorithm</button> :
              <DropdownButton id="dropdown-algorithm-button" title="Close algorithm">
                <Dropdown.Item onClick={() => algorithmClose(false)}>Keep first window</Dropdown.Item>
                <Dropdown.Item onClick={() => algorithmClose(true)}>Keep second window</Dropdown.Item>
              </DropdownButton>}
          </Stack>
        </div>
      </div>
    </>
  );
}
