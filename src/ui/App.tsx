import "./App.css";
// import EditButtons from "./EditButtons";
import { CoreProvider } from "../core/CoreContext";
// import VisualWindows from "./VisualWindows";
import GrammarWindow from "./GrammarWindow.tsx";

export default function App() {
  return (
    <CoreProvider>
      <h1>Víla Fojálka</h1>
      {/*<EditButtons />*/}
      {/*<VisualWindows />*/}
      <GrammarWindow />
    </CoreProvider>
  );
}
