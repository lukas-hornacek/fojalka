import React, { useState } from "react";
import { GrammarCore } from "../core/grammarCore";
import { GrammarType } from "../engine/grammar/grammar.ts";
import { ModeHolder } from "../core/core.ts";

interface ProductionRule {
  input: string;
  output: string[];
}

export const GrammarWindow: React.FC = () => {
  const grammarCoreRef = React.useRef(new GrammarCore(GrammarType.CONTEXT_FREE, new ModeHolder()));
  const [nonTerminals, setNonTerminals] = useState("");
  const [terminals, setTerminals] = useState("");
  const [rules, setRules] = useState<ProductionRule[]>([]);

  const [grammarRepr, setGrammarRepr] = useState("");

  const addRule = () => {
    setRules([...rules, { input: "", output: [""] }]);
  };

  const updateRule = (index: number, field: "input" | "output", value: string | string[]) => {
    const updatedRules = [...rules];
    if (field === "input") {
      updatedRules[index].input = value as string;
    } else {
      updatedRules[index].output = (value as string).split(" ").filter(Boolean);
    }
    setRules(updatedRules);
    // grammarCoreRef.current.addProductionRule(updatedRules[index]);
    // setGrammarString(grammarCoreRef.current.display());

  };

  const submitGrammar = () => {
    // const nts = nonTerminals.split(",").map(nt => nt.trim()).filter(Boolean);
    // const ts = terminals.split(",").map(t => t.trim()).filter(Boolean);
    //
    // grammarCoreRef.current.addNonterminals(nts);
    // grammarCoreRef.current.addTerminals(ts);
    //
    // rules.forEach(rule => {
    //   grammarCoreRef.current.addProductionRule(rule.input.trim(), rule.output.map(sym => sym.trim()));
    // });
    grammarCoreRef.current.addTerminals(["a", "b"]);
    grammarCoreRef.current.addNonterminals(["A", "B"]);
    grammarCoreRef.current.addProductionRule("A", ["a", "b"]);
    const newRepr = grammarCoreRef.current.visual.display();
    setGrammarRepr(newRepr);
  };

  return (
    <div>
      <h2>GRAMATIKA</h2>

      <div>
        <label>Non-Terminals: </label>
        <input value={nonTerminals} onChange={e => setNonTerminals(e.target.value)} placeholder="E.g. S,A,B" />
      </div>

      <div>
        <label>Terminals: </label>
        <input value={terminals} onChange={e => setTerminals(e.target.value)} placeholder="E.g. a,b,c" />
      </div>

      <h3>Rules:</h3>
      {rules.map((rule, index) =>
        <div key={index}>
          <input
            value={rule.input}
            onChange={e => updateRule(index, "input", e.target.value)}
            placeholder="LHS (e.g. S)"
          />
          →
          <input
            value={rule.output.join(" ")}
            onChange={e => updateRule(index, "output", e.target.value)}
            placeholder="RHS (e.g. a A)"
          />
        </div>
      )}
      <button onClick={addRule}>+ Add Rule</button>

      <div style={{ marginTop: "1rem" }}>
        <button onClick={submitGrammar}>Create Grammar</button>
      </div>

      {grammarRepr !== "" && <div>
        REPRESENTATION:
        <div>
          {grammarRepr}
        </div>
      </div>}
    </div>
  );
};

export default GrammarWindow;
