import { useContext, useRef, useState } from "react";
import { CoreContext } from "../core/CoreContext";
import { Kind } from "../core/core";
import ReactModal, { Styles } from "react-modal";

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

// buttons for testing interaction between UI and Core
export default function EditButtons() {
  const coreContext = useContext(CoreContext);

  const [isVisibleModal, setIsStateModal] = useState<boolean>(false);
  const [mode, setMode] = useState<mode>("none");

  const id = useRef("");
  const from = useRef("");
  const to = useRef("");
/*   const char = useRef(""); */

  const clickPosition = useRef<cytoscape.Position>({ x: 0, y: 0 });




  if (!coreContext) {
    throw new Error("AutomatonWindow must be used within a CoreProvider");
  }

  function closeModal() {
    console.log("closed modal");
    setMode("none");
    setIsStateModal(false);
  }

  function addState() {
    const core = coreContext!.primary;

    switch (core.kind) {
      case Kind.AUTOMATON: {
        setMode("createNode");

        // add an event handler which runs once and opens a dialog window on click
        const cy = core.getCytoscape();
        cy!.one("tap", (e) => {
          clickPosition.current = e.position;
          console.log(e.position);

          setIsStateModal(true);
        });

        break;
      }
      case Kind.GRAMMAR:
        console.log("Cannot add state to grammar.");
        break;
    }
  }

  function removeState() {
    const core = coreContext!.primary;

    switch (core.kind) {
      case Kind.AUTOMATON: {
        const e = core.removeState(id.current);
        if (e !== undefined) {
          console.log(e.details);
        }
        break;
      }
      case Kind.GRAMMAR:
        console.log("Cannot remove state from grammar.");
        break;
    }
  }

  function addEdge() {
    const core = coreContext!.primary;

    switch (core.kind) {
      case Kind.AUTOMATON: {
        setMode("createEdge");

        // add an event handler which runs once and opens a dialog window on click
        const cy = core.getCytoscape();
        cy!.one("tap", "node", (e) => {
          // remember fist node
          from.current = e.target.id();
          console.log("selected first node:", from.current);

          // highlight selected
          cy!.getElementById(from.current).style("background-color", "orange");

          // upon clicking the second time a dialog opens
          cy!.one("tap", "node", (e) => {
            to.current = e.target.id();
            console.log("selected second node:", to.current);

            // unhighlight
            cy!.getElementById(from.current).removeStyle("background-color");

            setIsStateModal(true);
          });
        });

        break;
      }
      case Kind.GRAMMAR:
        console.log("Cannot add edge to grammar.");
        break;
    }
  }

  function removeEdge() {
    const core = coreContext!.primary;

    switch (core.kind) {
      case Kind.AUTOMATON: {
        const e = core.removeEdge(from.current, to.current, id.current);
        if (e !== undefined) {
          console.log(e.details);
        }
        break;
      }
      case Kind.GRAMMAR:
        console.log("Cannot remove edge from grammar.");
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
    const core = coreContext!.primary;

    switch (core.kind) {
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
    const core = coreContext!.primary;

    switch (core.kind) {
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

  function formAddEdge(formData: FormData) {
    const core = coreContext!.primary;

    switch (core.kind) {
      case Kind.AUTOMATON: {
        const e = core.addEdge(from.current, to.current, {
          id: "",
          inputChar: formData.get("edge-character")?.toString() || "",
        });
        if (e !== undefined) {
          console.error(e.details);
          alert(`Error: ${e.details}`);
        } else {
          console.log("edge added successfuly");
          closeModal();
        }
        break;
      }
      case Kind.GRAMMAR:
        console.error("Cannot add state to grammar.");
        break;
    }
  }

  return (
    <>
      <div className="row">
        <div className="col-2">
          <div className="stack">
            <button
              className={`btn btn-primary ${
                mode === "createNode" ? "selectedButton" : ""
              }`}
              onClick={addState}
            >
              Add state
            </button>
            <button className="btn btn-primary" onClick={removeState}>
              Remove state
            </button>

            <button
              className={`btn btn-primary ${
                mode === "createEdge" ? "selectedButton" : ""
              }`}
              onClick={addEdge}
            >
              Add edge
            </button>
            <button className="btn btn-primary" onClick={removeEdge}>
              Remove edge
            </button>

            <button className="btn btn-primary" onClick={undo}>
              Undo
            </button>
            <button className="btn btn-primary" onClick={fit}>
              Fit automaton to screen
            </button>
          </div>
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
    </>
  );
}
