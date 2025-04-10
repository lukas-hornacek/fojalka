import "./App.css";
import EditButtons from "./EditButtons";
import { CoreProvider } from "../core/CoreContext";
import VisualWindows from "./VisualWindows";

export default function App() {
  return (
    <CoreProvider>
      <h1>Víla Fojálka</h1>
      <EditButtons />
      <VisualWindows />
    </CoreProvider>
  );
}
