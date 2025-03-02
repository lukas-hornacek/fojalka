import { CytoscapeProvider } from "./CytoscapeContext";
import "./App.css";
import AutomatonWindow from "./AutomatonWindow";
import AddStateButton from "./AddStateButton";

export default function App() {
    return (
        <CytoscapeProvider>
            <h1>Víla Fojálka</h1>
            <AddStateButton />
            <AutomatonWindow />
        </CytoscapeProvider>
    );
}