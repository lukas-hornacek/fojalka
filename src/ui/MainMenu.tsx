import { useContext, useState } from "react";
import { Core, ICore, ICoreType, Kind, Mode, ObjectType } from "../core/core";
import {
  Button,
  Dropdown,
  DropdownButton,
  Form,
  Modal,
  ToggleButton,
  ToggleButtonGroup,
} from "react-bootstrap";
import AutomatonEditButtons from "./buttons/AutomatonEditControls";
import {
  AutomatonVisualButtons,
  GrammarVisualButtons,
} from "./buttons/VisualButtons";
import { importAutomatonOrGrammar } from "../helperFunctions/importAndExport";
import { CoreContext } from "./App";
import { GrammarType } from "../engine/grammar/grammar";

export default function MainMenu({
  mode,
  primaryType,
  setCore,
}: {
  mode: Mode;
  primaryType: ICoreType;
  setCore: React.Dispatch<React.SetStateAction<ICore>>;
}) {
  const core = useContext(CoreContext);

  if (!core) {
    throw new Error("Buttons must be used within a CoreProvider");
  }

  return (
    <div>
      <div className="d-flex">
        <SwitchModeButtons mode={mode} />
        <NewWindowButton />
        {mode === Mode.EDIT ?
          <>
            <button
              type="button"
              id="import-button"
              className="btn btn-primary m-1"
              onClick={() => {
                // open file select dialog
                document.getElementById("file-input")?.click();
              }}
            >
              Import
            </button>
            <input
              type="file"
              id="file-input"
              style={{ display: "none" }}
              onChange={(e) => {
                console.log("file changed");
                const files = e.target.files;
                if (files?.length !== 1) {
                  alert("Select exactly one input file");
                  return;
                }

                const file = files[0];
                file.text().then((text) => {
                  const loaded = importAutomatonOrGrammar(text, core);
                  if (loaded != null) {
                    switch (loaded.kind) {
                      case Kind.AUTOMATON:
                        core.newWindow(ObjectType.AUTOMATON_FINITE);
                        console.log("AUTOMATON_FINITE");
                        break;
                      case Kind.GRAMMAR:
                        switch (loaded.type) {
                          case GrammarType.REGULAR:
                            core.newWindow(ObjectType.GRAMMAR_REGULAR);
                            console.log("GRAMMAR_REGULAR");
                            break;
                          case GrammarType.CONTEXT_FREE:
                            core.newWindow(ObjectType.GRAMMAR_PHRASAL);
                            console.log("GRAMMAR_PHRASAL");
                            break;
                        }
                    }

                    // I am done with it
                    // the audacity!
                    // the horror!
                    // the violation of good coding practises!
                    // behold!
                    // a fucking setInterval
                    const interval = setInterval(() => {
                      // force React to... react to the changes
                      // for something that has reacting in the name
                      // it sure is a lazy bitch
                      const core2 = new Core();
                      core2.setCorePrimary(loaded);

                      setCore(core2);
                      if (core2.primary.kind === Kind.AUTOMATON) {
                        core2.primary.init();
                      }

                      // I ..... dont know
                      clearInterval(interval);
                    }, 500);
                  }
                });
              }}
            />
          </>
          : null}
      </div>

      <hr />
      {mode === Mode.EDIT ?
        primaryType.kind === Kind.AUTOMATON ?
          <AutomatonEditButtons children={""} />
          : null
        : primaryType.kind === Kind.AUTOMATON ?
          <AutomatonVisualButtons />
          :
          <GrammarVisualButtons />
      }
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
      core.mode.mode = Mode.EDIT;
      core.primary.mode.mode = Mode.EDIT;
    } else {
      console.log(core);
      core.switchToVisualMode();
      core.mode.mode = Mode.VISUAL;
      core.primary.mode.mode = Mode.VISUAL;

      console.log(core);
    }
  };

  if (mode === Mode.EDIT) {
    return (
      <button
        className="btn btn-primary m-1"
        onClick={() => switchMode(Mode.VISUAL)}
      >
        Switch to Visual mode
      </button>
    );
  } else if (core.secondary === undefined) {
    return (
      <button
        className="btn btn-primary m-1"
        onClick={() => switchMode(Mode.EDIT, false)}
      >
        Switch to Edit mode
      </button>
    );
  } else {
    return (
      <DropdownButton
        id="dropdown-algorithm-button"
        title="Switch to Edit mode"
      >
        <Dropdown.Item onClick={() => switchMode(Mode.EDIT, false)}>
          Keep first window
        </Dropdown.Item>
        <Dropdown.Item onClick={() => switchMode(Mode.EDIT, true)}>
          Keep second window
        </Dropdown.Item>
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
      <button className="btn btn-primary m-1" onClick={() => setShow(true)}>
        New Window
      </button>

      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Nové okno</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={submit}>
            <ToggleButtonGroup
              name="objectType"
              type="radio"
              value={localType}
              onChange={setLocalType}
              vertical
              className="w-100"
            >
              <ToggleButton
                id="finite"
                value={ObjectType.AUTOMATON_FINITE}
                variant={
                  localType === ObjectType.AUTOMATON_FINITE
                    ? "primary"
                    : "outline-primary"
                }
              >
                Konečný stavový automat
              </ToggleButton>
              <ToggleButton
                id="regular"
                value={ObjectType.GRAMMAR_REGULAR}
                variant={
                  localType === ObjectType.GRAMMAR_REGULAR
                    ? "primary"
                    : "outline-primary"
                }
              >
                Regulárna gramatika
              </ToggleButton>
              <ToggleButton
                id="phrasal"
                value={ObjectType.GRAMMAR_PHRASAL}
                variant={
                  localType === ObjectType.GRAMMAR_PHRASAL
                    ? "primary"
                    : "outline-primary"
                }
              >
                Bezkontextová gramatika
              </ToggleButton>
            </ToggleButtonGroup>

            <Form.Group className="d-flex justify-content-center mt-2 gap-2">
              <Button type="submit">Vytvoriť</Button>
              <Button variant="danger" onClick={() => setShow(false)}>
                Zrušiť
              </Button>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <p className="text-danger">
            Vytvorenie nového okna zmaže existujúce okná.
          </p>
        </Modal.Footer>
      </Modal>
    </>
  );
}
