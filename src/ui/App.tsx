import "./styles/main.css";
import EditButtons from "./EditButtons";
import VisualWindows from "./VisualWindows";

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
