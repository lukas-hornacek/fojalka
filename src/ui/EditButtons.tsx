import { useContext, useRef } from "react";
import { CoreContext } from "../core/CoreContext";

// buttons for testing interaction between UI and Core
export default function EditButtons() {
    const coreContext = useContext(CoreContext);

    const id = useRef("");
    const from = useRef("");
    const to = useRef("");
    const char = useRef("");

    if (!coreContext) {
        throw new Error("AutomatonWindow must be used within a CoreProvider");
    }

    function addState() {
        const e = coreContext?.addState(id.current, { x: 200, y: 50 });
        if (e !== undefined) {
            console.log(e.details);
        }
    }

    function removeState() {
        const e = coreContext?.removeState(id.current);
        if (e !== undefined) {
            console.log(e.details);
        }
    }

    function addEdge() {
        const e = coreContext?.addEdge(from.current, to.current, { id: "", inputChar: char.current });
        if (e !== undefined) {
            console.log(e.details);
        }
    }

    function removeEdge() {
        const e = coreContext?.removeEdge(from.current, to.current, id.current);
        if (e !== undefined) {
            console.log(e.details);
        }
    }

    function undo() {
        const e = coreContext?.undo();
        if (e !== undefined) {
            console.log(e.details);
        }
    }

    function fit() {
        coreContext?.fit();
    }

    return (
        <>
            <div className="row">
                <div className="col-2">
                    <div>From:</div>
                    <input onChange={e => from.current = e.target.value}/>
                    <div>To:</div>
                    <input onChange={e => to.current = e.target.value}/>
                </div>
                <div className="col-2">
                    <div>Character:</div>
                    <input onChange={e => char.current = e.target.value}/>
                    <div>ID:</div>
                    <input onChange={e => id.current = e.target.value}/>
                </div>
                <div className="col-2">
                    <div className="stack">
                        <button className="btn btn-primary" onClick={addEdge}>Add edge</button>
                        <button className="btn btn-primary" onClick={removeEdge}>Remove edge</button>
                        
                        <button className="btn btn-primary" onClick={addState}>Add state</button>
                        <button className="btn btn-primary" onClick={removeState}>Remove state</button>

                        <button className="btn btn-primary" onClick={undo}>Undo</button>
                        <button className="btn btn-primary" onClick={fit}>Fit automaton to screen</button>
                    </div>
                </div>
            </div>
        </>
    );
}