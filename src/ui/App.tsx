import "./App.css";
import AddStateButton from "./AddStateButton";
import { CoreProvider } from "../core/CoreContext";
import VisualWindows from "./VisualWindows";

export default function App() {
  return (
    <CoreProvider>
      <h1>Víla Fojálka</h1>
      <AddStateButton />
      <VisualWindows />
    </CoreProvider>
  );
}
