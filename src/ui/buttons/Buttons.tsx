import { useContext, useState } from "react";
import { ICoreType, Kind, Mode, ObjectType } from "../../core/core";
import { CoreContext } from "../../core/CoreContext";
import { Button, Dropdown, DropdownButton, Form, Modal, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import AutomatonEditButtons from "./AutomatonEditButtons";
import { AutomatonVisualButtons, GrammarVisualButtons } from "./VisualButtons";

export default function Buttons({ mode, primaryType }: { mode: Mode, primaryType: ICoreType }) {
  const core = useContext(CoreContext);

  if (!core) {
    throw new Error("Buttons must be used within a CoreProvider");
  }

  if (mode === Mode.EDIT) {
    // grammar has buttons embedded inside GrammarWindow, so there is no need to put anything here
    return (
      <div>
        <GlobalButtons mode={mode} />
        <hr />
        {primaryType.kind === Kind.AUTOMATON ? <AutomatonEditButtons children={""} /> : null}
      </div>
    );
  } else {
    return (
      <div>
        <GlobalButtons mode={mode} />
        <hr />
        {primaryType.kind === Kind.AUTOMATON ? <AutomatonVisualButtons /> : <GrammarVisualButtons />}
      </div>
    );
  }
}

// switch mode, change window type, import/export (maybe only in edit mode?)
function GlobalButtons({ mode }: { mode: Mode }) {
  const core = useContext(CoreContext);

  if (!core) {
    throw new Error("GlobalButtons must be used within a CoreProvider");
  }

  return (
    <div className="d-flex">
      <SwitchModeButtons mode={mode} />
      <NewWindowButton />
      {mode === Mode.EDIT ? <ImportExportButtons /> : null}
    </div>
  );
}

function SwitchModeButtons({ mode }: { mode: Mode }) {
  const core = useContext(CoreContext);

  if (!core) {
    throw new Error("SwitchModeButtons must be used within a CoreProvider");
  }

  const switchMode = (mode: Mode, keepSecondary: boolean = false) => {
    if (mode === Mode.EDIT) {
      core.switchToEditMode(keepSecondary);
    } else {
      core.switchToVisualMode();
    }
  };

  if (mode === Mode.EDIT) {
    return (
      <button className="btn btn-primary" onClick={() => switchMode(Mode.VISUAL)}>Switch to Visual mode</button>
    );
  } else if (core.secondary === undefined) {
    return (
      <button className="btn btn-primary" onClick={() => switchMode(Mode.EDIT, false)}>Switch to Edit mode</button>
    );
  } else {
    return (
      <DropdownButton id="dropdown-algorithm-button" title="Switch to Edit mode">
        <Dropdown.Item onClick={() => switchMode(Mode.EDIT, false)}>Keep first window</Dropdown.Item>
        <Dropdown.Item onClick={() => switchMode(Mode.EDIT, true)}>Keep second window</Dropdown.Item>
      </DropdownButton>
    );
  }
}

function NewWindowButton() {
  const core = useContext(CoreContext);
  const [show, setShow] = useState(false);

  const [localType, setLocalType] = useState(ObjectType.AUTOMATON_FINITE);

  if (!core) {
    throw new Error("NewWindowButton must be used within a CoreProvider");
  }

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    core.newWindow(localType);
    setShow(false);
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setShow(true)}>New Window</button>

      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Nové okno</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={submit}>
            <ToggleButtonGroup name="objectType" type="radio" value={localType} onChange={setLocalType} vertical className="w-100">
              <ToggleButton
                id="finite"
                value={ObjectType.AUTOMATON_FINITE}
                variant={localType === ObjectType.AUTOMATON_FINITE ? "primary" : "outline-primary"}
              >Konečný stavový automat</ToggleButton>
              <ToggleButton
                id="regular"
                value={ObjectType.GRAMMAR_REGULAR}
                variant={localType === ObjectType.GRAMMAR_REGULAR ? "primary" : "outline-primary"}
              >Regulárna gramatika</ToggleButton>
              <ToggleButton
                id="phrasal"
                value={ObjectType.GRAMMAR_PHRASAL}
                variant={localType === ObjectType.GRAMMAR_PHRASAL ? "primary" : "outline-primary"}
              >Bezkontextová gramatika</ToggleButton>
            </ToggleButtonGroup>

            <Form.Group className="d-flex justify-content-center mt-2 gap-2">
              <Button type="submit">Vytvoriť</Button>
              <Button variant="danger" onClick={() => setShow(false)}>Zrušiť</Button>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <p className="text-danger">Vytvorenie nového okna zmaže existujúce okná.</p>
        </Modal.Footer>
      </Modal>
    </>
  );
}

// TODO
function ImportExportButtons() {
  return (
    <>
      <button className="btn btn-primary">Import</button>
      <button className="btn btn-primary">Export</button>
    </>
  );
}
