import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { Kind } from "../../core/core";
import ReactModal, { Styles } from "react-modal";
import Mousetrap from "mousetrap";
import { exportAutomaton } from "../../helperFunctions/importAndExport";
import NodeEditables from "../NodeEditables";
import EdgeEditables from "../EdgeEditables";
import { CoreContext } from "../App";
import { cyLayout } from "../../helperFunctions/cyLayoutHelper";

ReactModal.setAppElement("#root");

const customModalStyles: Styles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
  },
};

type mode = "none" | "createNode" | "createEdge";

interface Props {
  children: ReactNode;
}

export default function AutomatonEditControls({ children }: Props) {
  const coreContext = useContext(CoreContext);

  if (coreContext === undefined) {
    throw new Error("This shit, too, must be used within a CoreProvider");
  }

  const [isVisibleModal, setIsStateModal] = useState<boolean>(false);
  const [mode, setMode] = useState<mode>("none");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>("");
  const [selectedEdgeChar, setSelectedEdgeChar] = useState<string>("");

  const from = useRef("");
  const to = useRef("");

  const clickPosition = useRef<cytoscape.Position>({ x: 0, y: 0 });

  // keyboard shortcuts
  // https://www.npmjs.com/package/mousetrap
  Mousetrap.bind("+", function () {
    addState();
  });
  Mousetrap.bind("s", function () {
    addState();
  });

  Mousetrap.bind("e", function () {
    addEdge();
  });

  Mousetrap.bind("x", function () {
    removeElement();
  });
  Mousetrap.bind("del", function () {
    removeElement();
  });

  Mousetrap.bind("esc", function () {
    setMode("none");
  });

  // handlers
  const clickNodeHandler = (e: cytoscape.EventObject) => {
    setSelectedNodeId("");
    setSelectedEdgeId("");
    setSelectedNodeId(e.target.id());
    console.log("node edit click:", e.target.id());
  };

  const clickEdgeHandler = (e: cytoscape.EventObject) => {
    setSelectedEdgeId(e.target.data().id);
    setSelectedEdgeChar(e.target.data().label);
    setSelectedNodeId("");
    console.log("edge edit click:", e.target.data());
  };

  const addNodeHandler = (e: cytoscape.EventObject) => {
    if (e.target.id == null) {
      // we don't want to create two nodes on top of each other
      clickPosition.current = e.position;
      console.log(e.position);

      setSelectedEdgeId("");
      setSelectedNodeId("");
      setIsStateModal(true);
    }
  };

  const addEdgeHandler = (e: cytoscape.EventObject) => {
    if (from.current == "") {
      // first click
      from.current = e.target.id();
      console.log("selected first node:", from.current);
    } else {
      // second click
      to.current = e.target.id();
      console.log("selected second node:", to.current);

      setSelectedEdgeId("");
      setSelectedNodeId("");
      setIsStateModal(true);
    }
  };

  const clickElsewhereHandler = (e: cytoscape.EventObject) => {
    if (e.target.id == null) {
      console.log("clicked elsewhere");
      from.current = "";
      setSelectedNodeId("");
      setSelectedEdgeId("");
    }
  };

  // upon creation I guess
  useEffect(() => {
    console.log("activation!!!");
    if (coreContext.primary.kind === Kind.AUTOMATON) {
      coreContext.primary.callbackAfterInit((cy) => {
        cy.on("tap", "node", clickNodeHandler);
        cy.on("tap", "edge", clickEdgeHandler);
        cy.on("tap", clickElsewhereHandler);
      });
    }
  }, [coreContext]);

  // set handler based on the mode
  useEffect(() => {
    const core = coreContext?.primary;
    const cy = core.getCytoscape();

    switch (mode) {
      case "createNode":
        // remove other listeners and install mine
        cy!.removeListener("tap");
        cy!.on("tap", addNodeHandler);
        return;
      case "createEdge":
        cy!.removeListener("tap");
        cy!.on("tap", "node", addEdgeHandler);
        cy!.on("tap", clickElsewhereHandler);
        return;
      case "none":
        if (cy != null) {
          cy.removeListener("tap");
          cy.on("tap", "node", clickNodeHandler);
          cy.on("tap", "edge", clickEdgeHandler);
          cy!.on("tap", clickElsewhereHandler);
        }
        return;
    }
  }, [mode]);

  if (!coreContext) {
    throw new Error("AutomatonWindow must be used within a CoreProvider");
  }

  function closeModal() {
    console.log("closed modal");
    setIsStateModal(false);
    setMode("none");
  }

  function addState() {
    const core = coreContext?.primary;

    // the button works like a toggle
    if (mode == "createNode") {
      setMode("none");
      return;
    }

    switch (core?.kind) {
      case Kind.AUTOMATON: {
        setMode("createNode");

        break;
      }
      case Kind.GRAMMAR:
        console.log("Cannot add state to grammar.");
        break;
    }
  }

  function addEdge() {
    const core = coreContext?.primary;

    // the button works like a toggle
    if (mode == "createEdge") {
      setMode("none");
      return;
    }

    switch (core?.kind) {
      case Kind.AUTOMATON: {
        setMode("createEdge");

        break;
      }
      case Kind.GRAMMAR:
        console.log("Cannot add edge to grammar.");
        break;
    }
  }

  function removeElement() {
    setMode("none");

    const core = coreContext?.primary;
    const cy = core?.getCytoscape();

    switch (core?.kind) {
      case Kind.AUTOMATON: {
        // remove nodes
        cy!
          .elements("node:selected")
          .toArray()
          .map((x) => {
            const e = core.removeState(x.data("id"));
            if (e !== undefined) {
              alert(e.details);
              console.error(e.details);
            }
          });

        // remove edges
        cy!
          .elements("edge:selected")
          .toArray()
          .map((x) => {
            const e = core.removeEdge(
              x.data("source"),
              x.data("target"),
              x.data("id")
            );
            if (e !== undefined) {
              alert(e.details);
              console.error(e.details);
            }
          });

        break;
      }
      case Kind.GRAMMAR:
        console.log("Cannot remove elements from grammar.");
        break;
    }
  }

  function undo() {
    const e = coreContext?.primary.undo();
    if (e !== undefined) {
      console.log(e.details);
    }
  }

  function fit() {
    const core = coreContext?.primary;

    switch (core?.kind) {
      case Kind.AUTOMATON: {
        core.fit();
        break;
      }
      case Kind.GRAMMAR:
        console.log("Fit is not applicable to grammar window.");
        break;
    }
  }

  function formAddState(formData: FormData) {
    const core = coreContext?.primary;

    switch (core?.kind) {
      case Kind.AUTOMATON: {
        const e = core.addState(
          formData.get("state-name")?.toString() || "",
          clickPosition.current
        );

        if (e !== undefined) {
          console.error(e.details);
          alert(`Error: ${e.details}`);
        } else {
          console.log("state added successfuly");
          closeModal();
        }
        break;
      }
      case Kind.GRAMMAR:
        console.error("Cannot add state to grammar.");
        break;
    }
  }

  function formEditState(formData: FormData) {
    const core = coreContext?.primary;

    switch (core?.kind) {
      case Kind.AUTOMATON: {
        // set as final
        const e2 = core.setIsFinalState(
          selectedNodeId,
          formData.get("state-is-final") != null
        );

        if (e2 !== undefined) {
          console.error(e2.details);
          alert(`Error: ${e2.details}`);
        }

        // set new name
        if (formData.get("state-name")?.toString() !== selectedNodeId) {
          const e = core.renameState(
            selectedNodeId,
            formData.get("state-name")?.toString() || selectedNodeId
          );
          if (e !== undefined) {
            console.error(e.details);
            alert(`Error: ${e.details}`);
          }
        }

        closeModal();

        setSelectedNodeId("");
        break;
      }
      case Kind.GRAMMAR:
        console.error("Cannot edit state in grammar.");
        break;
    }
  }

  function formSetInitialState() {
    const core = coreContext?.primary;

    switch (core?.kind) {
      case Kind.AUTOMATON: {
        // set initial
        const e = core.setInitialState(selectedNodeId);

        if (e !== undefined) {
          console.error(e.details);
          alert(`Error: ${e.details}`);
        } else {
          console.log("state successfuly set as initial");
        }

        closeModal();

        setSelectedNodeId("");
        break;
      }
      case Kind.GRAMMAR:
        console.error("Cannot edit state in grammar.");
        break;
    }
  }

  function formAddEdge(formData: FormData) {
    const core = coreContext?.primary;

    switch (core?.kind) {
      case Kind.AUTOMATON: {
        const char = formData.get("edge-character")?.toString() || "";

        const e = core.addEdge(from.current, to.current, {
          id: "",
          inputChar: char,
        });
        if (e !== undefined) {
          console.error(e.details);
          alert(`Error: ${e.details}`);
        } else {
          console.log("edge added successfuly");
          closeModal();

          // set the end node as the start node
          from.current = to.current;
        }
        break;
      }
      case Kind.GRAMMAR:
        console.error("Cannot add edge to grammar.");
        break;
    }
  }

  function formEditEdge(formData: FormData) {
    const core = coreContext?.primary;

    switch (core?.kind) {
      case Kind.AUTOMATON: {
        const char = formData.get("edge-character")?.toString() || "";

        const e = core.editEdge(selectedEdgeId, {
          id: selectedEdgeId,
          inputChar: char,
        });
        if (e !== undefined) {
          console.error(e.details);
          alert(`Error: ${e.details}`);
        } else {
          console.log("edge edited successfuly");
          closeModal();
        }
        setSelectedEdgeId("");
        break;
      }
      case Kind.GRAMMAR:
        console.error("Cannot change edge im grammar.");
        break;
    }
  }

  return (
    <>
      <div className="row">
        <div className="col-6">
          <div className="stack">
            <button
              className={`btn btn-primary m-1 ${
                mode === "createNode" ? "selectedButton" : ""
              }`}
              onClick={addState}
            >
              Add state
            </button>

            <button
              className={`btn btn-primary m-1 ${
                mode === "createEdge" ? "selectedButton" : ""
              }`}
              onClick={addEdge}
            >
              Add edge
            </button>
            <button className="btn btn-primary m-1" onClick={removeElement}>
              Remove states or edges
            </button>

            <button className="btn btn-primary m-1" onClick={undo}>
              Undo
            </button>
            <button className="btn btn-primary m-1" onClick={fit}>
              Fit automaton to screen
            </button>
            <button
              className="btn btn-primary m-1"
              onClick={() => cyLayout(coreContext.getCytoscape()!)}
            >
              Re-layout
            </button>

            <button
              className="btn btn-primary m-1"
              onClick={() => {
                if (coreContext?.primary.kind === Kind.AUTOMATON) {
                  console.log(exportAutomaton(coreContext?.primary));
                }
              }}
            >
              Export
            </button>

            {/* <button
              type="button"
              id="import-button"
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
                  const newAutomatonCore = AutomatonCore.fromSavedJSON(
                    text,
                    (automatonCore) => {
                      automatonCore
                        .getCytoscape()!
                        .on("tap", "node", clickNodeHandler);
                      automatonCore
                        .getCytoscape()!
                        .on("tap", "edge", clickEdgeHandler);
                      automatonCore
                        .getCytoscape()!
                        .on("tap", clickElsewhereHandler);
                    }
                  );
                  coreContext.setCorePrimary(newAutomatonCore);
                });
              }}
            /> */}
          </div>
          {/*       does not work ://
            {selectedNodeId === "" &&
            selectedEdgeId === "" &&
            mode === "createEdge" && (
              <div className="editables">
                {from.current === ""
                  ? "Select first node"
                  : "Select second node"}
              </div>
            )} */}
          {selectedNodeId !== "" &&
            <div>
              <NodeEditables id={selectedNodeId} formAction={formEditState} setInitial={formSetInitialState} />
            </div>
          }
          {selectedEdgeId !== "" &&
            <div>
              <EdgeEditables
                char={selectedEdgeChar}
                formAction={formEditEdge}
              />
            </div>
          }
        </div>
      </div>

      <ReactModal
        isOpen={isVisibleModal && mode === "createNode"}
        style={customModalStyles}
      >
        <button onClick={closeModal}>close</button>
        <h2>Add state</h2>
        <form action={formAddState}>
          <label htmlFor="state-name">Name of the state: </label>
          <input type="text" id="state-name" name="state-name" autoFocus />

          <button type="submit">Add state</button>
        </form>
      </ReactModal>

      <ReactModal
        isOpen={isVisibleModal && mode === "createEdge"}
        style={customModalStyles}
      >
        <button onClick={closeModal}>close</button>
        <h2>Add edge</h2>
        <form action={formAddEdge}>
          <label htmlFor="edge-character">Edge character: </label>
          <input
            type="text"
            id="edge-character"
            name="edge-character"
            autoFocus
          />

          <button type="submit">Add edge</button>
        </form>
      </ReactModal>
      {children}
    </>
  );
}
