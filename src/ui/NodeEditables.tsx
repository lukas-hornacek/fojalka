import { useContext } from "react";
import { CoreContext } from "./App";
import { Kind } from "../core/core";

interface NodeEditablesProps {
  id: string;
  formAction: (formData: FormData) => void;
}

export default function NodeEditables({ id, formAction }: NodeEditablesProps) {
  const coreContext = useContext(CoreContext);

  if (coreContext === undefined) {
    throw new Error("This shit, too, must be used within a CoreProvider");
  }

  return <div className="editables">
    <h2>Edit state</h2>
    <form action={formAction}>
      <label htmlFor="state-name">Name of the state: </label>
      <input type="text" id="state-name" defaultValue={id} name="state-name" />

      <br />

      <input type="checkbox" id="state-is-initial" name="state-is-initial" defaultChecked={
        coreContext.primary.kind === Kind.AUTOMATON ? coreContext.primary.automaton.initialStateId === id : false
      }/ >
      <label htmlFor="state-is-initial">Is initial state</label>

      <br />

      <input type="checkbox" id="state-is-final" name="state-is-final" defaultChecked={
        coreContext.primary.kind === Kind.AUTOMATON ? coreContext.primary.automaton.finalStateIds.includes(id) : false
      }/>
      <label htmlFor="state-is-final">Is final state</label>

      <br />

      <button type="submit">Edit state</button>
    </form>
  </div>;
}
