import { useContext } from "react";
import { ICoreType, Kind } from "../core/core";
import { CoreContext } from "../core/CoreContext";
import AutomatonWindow from "./AutomatonWindow";
import GrammarWindow from "./components/grammar-window/GrammarWindow";

export default function Windows({ primaryType, secondaryType }: { primaryType: ICoreType, secondaryType: ICoreType | undefined }) {
  const core = useContext(CoreContext);

  if (!core) {
    throw new Error("Windows must be used within a CoreProvider");
  }

  if (secondaryType === undefined) {
    return (
      <div id="cy-window" className="d-flex flex-row">
        <div className="col-12">
          {primaryType.kind === Kind.AUTOMATON ? <AutomatonWindow primary={true} /> : <GrammarWindow primary={true} />}
        </div>
      </div>
    );
  } else {
    return (
      <div id="cy-window" className="d-flex flex-row">
        <div className="col-6">
          {primaryType.kind === Kind.AUTOMATON ? <AutomatonWindow primary={true} /> :
            <GrammarWindow primary={true} />}
        </div>
        <div className="col-6">
          {secondaryType.kind === Kind.AUTOMATON ? <AutomatonWindow primary={false} /> :
            <GrammarWindow primary={false} />}
        </div>
      </div>
    );
  }
}
