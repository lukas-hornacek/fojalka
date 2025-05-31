import { useContext } from "react";
import { Kind, ObjectType } from "../core/core";
import { CoreContext } from "../core/CoreContext";
import AutomatonWindow from "./AutomatonWindow";
import GrammarRepresentation from "./components/grammar-window/GrammarRepresentation";
import GrammarWindow from "./components/grammar-window/GrammarWindow";
import { GrammarType } from "../engine/grammar/grammar";

export default function Windows({ primaryType, secondaryType }: { primaryType: ObjectType, secondaryType: ObjectType | undefined }) {
  const core = useContext(CoreContext);

  if (!core) {
    throw new Error("Windows must be used within a CoreProvider");
  }

  if (secondaryType === undefined) {
    return (
      <div id="cy-window" className="d-flex flex-row">
        <div className="col-12">
          {primaryType === ObjectType.AUTOMATON_FINITE ? <AutomatonWindow primary={true} /> :
            <GrammarWindow grammarType={secondaryType === ObjectType.GRAMMAR_REGULAR ? GrammarType.REGULAR : GrammarType.CONTEXT_FREE} />}
        </div>
      </div>
    );
  } else {
    return (
      <div id="cy-window" className="d-flex flex-row">
        <div className="col-6">
          {primaryType === ObjectType.AUTOMATON_FINITE ? <AutomatonWindow primary={true} /> :
            <GrammarWindow grammarType={secondaryType === ObjectType.GRAMMAR_REGULAR ? GrammarType.REGULAR : GrammarType.CONTEXT_FREE} />}
        </div>
        <div className="col-6">
          {secondaryType === ObjectType.AUTOMATON_FINITE ? <AutomatonWindow primary={true} /> :
            <GrammarRepresentation grammarRepr={core.secondary?.kind === Kind.GRAMMAR ? core.secondary.display() : ""} />}
        </div>
      </div>
    );
  }
}
