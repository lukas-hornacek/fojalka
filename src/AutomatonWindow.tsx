import { useEffect, useContext } from "react";
import { CytoscapeContext } from "./CytoscapeContext";

// component that holds and initializes the cytoscape element
export default function AutomatonWindow() {
    const cy = useContext(CytoscapeContext);

    useEffect(() => {
        cy.init();
    }, [cy]);

    return (
        <div id='cy'></div>
    );
}