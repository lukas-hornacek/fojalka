import { ICoreType, Kind } from "../core/core";
import AutomatonWindow from "./AutomatonWindow";
import GrammarWindow from "./components/grammar-window/GrammarWindow";

export default function Windows({ primaryType, secondaryType }: { primaryType: ICoreType, secondaryType: ICoreType | undefined }) {
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
