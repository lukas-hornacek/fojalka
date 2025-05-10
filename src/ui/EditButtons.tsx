import { useContext, useEffect, useRef, useState } from "react";
import { CoreContext } from "../core/CoreContext";
import { Kind } from "../core/core";
import ReactModal, { Styles } from "react-modal";
import Mousetrap from "mousetrap";

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

  /* const id = useRef(""); */
  const from = useRef("");
  const to = useRef("");
  /*   const char = useRef(""); */

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
  const addNodeHandler = (e: cytoscape.EventObject) => {
    if (e.target.id == null) {
      // we don't want to create two nodes on top of each other
      clickPosition.current = e.position;
      console.log(e.position);

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

      setIsStateModal(true);
    }
  };

  const clickElsewhereHandler = (e: cytoscape.EventObject) => {
    if (e.target.id == null) {
      console.log("clicked elsewhere");
      from.current = "";
    }
  };

  // set handler based on the mode
  useEffect(() => {
    const core = coreContext!.primary;
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
  }

  function addState() {
    const core = coreContext!.primary;

    // the button works like a toggle
    if (mode == "createNode") {
      setMode("none");
      return;
    }

    switch (core.kind) {
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
    const core = coreContext!.primary;

    // the button works like a toggle
    if (mode == "createEdge") {
      setMode("none");
      return;
    }

    switch (core.kind) {
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

    const core = coreContext!.primary;
    const cy = core.getCytoscape();

    switch (core.kind) {
      case Kind.AUTOMATON: {
        // remove nodes
        cy!
          .elements("node:selected")
          .toArray()
          .map((x) => {
            const e = core.removeState(x.data("id"));
            if (e !== undefined) {
              console.log(e.details);
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
              console.log(e.details);
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

          // set the end node as the start node
          from.current = to.current;
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

            <button
              className={`btn btn-primary ${
                mode === "createEdge" ? "selectedButton" : ""
              }`}
              onClick={addEdge}
            >
              Add edge
            </button>
            <button className="btn btn-primary" onClick={removeElement}>
              Remove states or edges
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
