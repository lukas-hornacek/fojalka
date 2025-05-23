import "./App.css";
import EditButtons from "./EditButtons";
import { CoreProvider } from "../core/CoreContext";
import VisualWindows from "./VisualWindows";
import GrammarWindow from "./components/grammar-window/GrammarWindow.tsx";
import { GrammarType } from "../engine/grammar/grammar.ts";

export default function App() {
  return (
    <CoreProvider>
      <h1>Víla Fojálka</h1>
      <EditButtons />
      <VisualWindows />
      <GrammarWindow grammarType={GrammarType.CONTEXT_FREE}/>
    </CoreProvider>
  );
}
