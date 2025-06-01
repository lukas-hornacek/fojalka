import { useContext, useRef } from "react";
import { CoreContext } from "../../core/CoreContext";
import { Kind } from "../../core/core";

// buttons for testing interaction between UI and Core
export default function AutomatonEditButtons() {
  const coreContext = useContext(CoreContext);

  const id = useRef("");
  const from = useRef("");
  const to = useRef("");
  const char = useRef("");

  if (!coreContext) {
    throw new Error("AutomatonWindow must be used within a CoreProvider");
  }

  function addState() {
    const core = coreContext!.primary;

    switch (core.kind) {
      case Kind.AUTOMATON: {
        const e = core.addState(id.current, { x: 200, y: 50 });
        if (e !== undefined) {
          console.log(e.details);
        }
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
        const e = core.addEdge(from.current, to.current, { id: "", inputChar: char.current });
        if (e !== undefined) {
          console.log(e.details);
        }
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

  return (
    <>
      <div className="d-flex">

        <div className="col">
          <div>From:</div>
          <input onChange={e => from.current = e.target.value}/>
        </div>
        <div className="col">
          <div>To:</div>
          <input onChange={e => to.current = e.target.value}/>
        </div>
        <div className="col">
          <div>Character:</div>
          <input onChange={e => char.current = e.target.value}/>
        </div>
        <div className="col">
          <div>ID:</div>
          <input onChange={e => id.current = e.target.value}/>
        </div>

        <button className="btn btn-primary mt-auto" onClick={addEdge}>Add edge</button>
        <button className="btn btn-primary mt-auto" onClick={removeEdge}>Remove edge</button>
        <button className="btn btn-primary mt-auto" onClick={addState}>Add state</button>
        <button className="btn btn-primary mt-auto" onClick={removeState}>Remove state</button>

        <button className="btn btn-primary mt-auto" onClick={undo}>Undo</button>
        <button className="btn btn-primary mt-auto" onClick={fit}>Fit automaton to screen</button>
      </div>
    </>
  );
}
