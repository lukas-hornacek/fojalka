import "./styles/main.css";
import EditButtons from "./EditButtons";
import VisualWindows from "./VisualWindows";
import GrammarWindow from "./components/grammar-window/GrammarWindow.tsx";
import { GrammarType } from "../engine/grammar/grammar.ts";

export default function App() {
  return (
    <>
      <h1>Víla Fojálka</h1>
      <EditButtons>
        <VisualWindows />
      </EditButtons>
    </>
  );
}
