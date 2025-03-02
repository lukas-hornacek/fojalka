import { useContext } from "react";
import { CytoscapeContext } from "./CytoscapeContext";

// example button that will be replaced
export default function AddStateButton() {
    const cy = useContext(CytoscapeContext);

    function addState() {
        cy.addNode("z", { x: 200, y: 50 });
    }

    return (
        <button onClick={addState}>Add State</button>
    );
}