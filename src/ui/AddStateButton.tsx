import { useContext, useRef } from "react";
import { CoreContext } from "../core/CoreContext";

// example button that will be replaced
export default function AddStateButton() {
    const coreContext = useContext(CoreContext);

    const stateId = useRef("");

    if (!coreContext) {
        throw new Error("AutomatonWindow must be used within a CoreProvider");
    }

    function addState() {
        coreContext?.addState(stateId.current, { x: 200, y: 50 });
    }

    return (
        <form onSubmit={e => {
            e.preventDefault();
            addState();
        }}>
            <input className="form-control" onChange={e => stateId.current = e.target.value}/>
            <button className="btn btn-primary">Send</button>
        </form>
    );
}