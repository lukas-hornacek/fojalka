import { Cytoscape, CytoscapeContext } from './CytoscapeContext';
import './App.css';
import AutomatonWindow from './AutomatonWindow';
import AddStateButton from './AddStateButton';

export default function App() {
    return (
        <CytoscapeContext.Provider value={new Cytoscape()}>
            <h1>Víla Fojálka</h1>
            <AddStateButton />
            <AutomatonWindow />
        </CytoscapeContext.Provider>
    );
}