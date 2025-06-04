import { useContext, useEffect, useState } from "react";
import { CoreContext } from "./App";
import { Kind } from "../core/core";

interface NodeEditablesProps {
  id: string;
  formAction: (formData: FormData) => void;
  setInitial: () => void;
}

export default function NodeEditables({
  id,
  formAction,
  setInitial,
}: NodeEditablesProps) {
  const coreContext = useContext(CoreContext);

  if (coreContext === undefined) {
    throw new Error("This shit, too, must be used within a CoreProvider");
  }

  const [isFinal, setIsFinal] = useState<boolean>(false);

  useEffect(() => {
    setIsFinal(
      coreContext.primary.kind === Kind.AUTOMATON
        ? coreContext.primary.automaton.finalStateIds.includes(id)
        : false
    );
  }, [id]);

  return (
    <div className="editables">
      <h2>Edit state</h2>
      <form action={formAction}>
        <label htmlFor="state-name">Name of the state: </label>
        <input
          type="text"
          id="state-name"
          defaultValue={id}
          name="state-name"
        />

        <br />
        {/*
      <input type="checkbox" id="state-is-initial" name="state-is-initial" defaultChecked={
        coreContext.primary.kind === Kind.AUTOMATON ? coreContext.primary.automaton.initialStateId === id : false
      }/ >
      <label htmlFor="state-is-initial">Is initial state</label> */}

        <br />

        <input
          type="checkbox"
          id="state-is-final"
          name="state-is-final"
          checked={isFinal}
          onChange={(e) => setIsFinal(e.target.checked)}
        />
        <label htmlFor="state-is-final">Is final state</label>

        <br />

        <button className="btn btn-primary m-1" type="submit">
          Edit state
        </button>
        <button className="btn btn-primary m-1" type="button" onClick={setInitial}>
          Set as initial
        </button>
      </form>
    </div>
  );
}

// one more swear word
// frick
