import "./App.css";
import AutomatonWindow from "./AutomatonWindow";
import AddStateButton from "./AddStateButton";
import { CoreProvider } from "../core/CoreContext";

export default function App() {
  return (
    <CoreProvider>
      <h1>Víla Fojálka</h1>
      <AddStateButton />
      <AutomatonWindow />
    </CoreProvider>
  );
}
