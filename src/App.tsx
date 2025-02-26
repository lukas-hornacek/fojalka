import cytoscape from 'cytoscape';

import './App.css';
import { Component } from 'react';

// Example initialization of the Cytoscape library in a React component
export default class App extends Component {
    cy: cytoscape.Core | undefined;

    componentDidMount() {
        this.cy = cytoscape({
            container: document.getElementById("cy"),

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

    componentWillUnmount() {
        this.cy?.destroy();
    }

    render() {
        return (
            <>
                <h1>Víla Fojálka</h1>
                <div id='cy'></div>
            </>
        );
    }
}