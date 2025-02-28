import cytoscape from "cytoscape";
import { createContext } from "react";

export class Cytoscape {
    cy: cytoscape.Core;
    
    constructor() {
        this.cy = cytoscape();
    }

    init() {
        this.cy = cytoscape({
            container: document.getElementById("cy"),

            // example elements, that should be removed once user can add them themselves
            elements: [
                { group: 'nodes', data: { id: 'x' }, position: { x: 100, y: 100 } },
                { group: 'nodes', data: { id: 'y' }, position: { x: 300, y: 100 } },
                { group: 'edges', data: { id: 'a', source: 'x', target: 'y' } },
            ],

            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#666',
                        'label': 'data(id)'
                    }
                },
        
                {
                    selector: 'edge',
                    style: {
                        'width': 3,
                        'line-color': '#ccc',
                        'target-arrow-color': '#ccc',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'label': 'data(id)'
                    }
                }
            ],
        
            layout: {
                name: 'preset',
            }
        });
    }

    addNode(id: string, position: { x: number, y: number }) {
        this.cy.add({ group: 'nodes', data: { id: id }, position: position });
    }
}

export const CytoscapeContext = createContext(new Cytoscape());
