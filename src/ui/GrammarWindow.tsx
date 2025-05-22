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
  const [nonTerminals, setNonTerminals] = useState<string[]>([]);
  const [terminals, setTerminals] = useState<string[]>([]);
  const [rules, setRules] = useState<ProductionRule[]>([]);
  const [newRule, setNewRule] = useState({ input: "", output: "" });
  const [newNonTerminal, setNewNonTerminal] = useState("");
  const [newTerminal, setNewTerminal] = useState("");

  const [grammarRepr, setGrammarRepr] = useState("");

  const refreshRepr = () => {
    const newRepr = grammarCoreRef.current.visual.display();
    setGrammarRepr(newRepr);
  };

  const handleAddNonTerminal = () => {
    const maybeError = grammarCoreRef.current.addNonterminals([newNonTerminal]);
    if (maybeError) {
      alert(maybeError.details);
      return;
    }
    setNonTerminals(prev => [...prev, newNonTerminal]);
    setNewNonTerminal("");
    refreshRepr();
  };

  const handleDeleteNonTerminal = (index: number) => {
    const nonTerminal = nonTerminals[index];
    const maybeError = grammarCoreRef.current.removeNonterminal(nonTerminal);
    if (maybeError) {
      alert(maybeError.details);
      return;
    }
    setNonTerminals(prev => [...prev.slice(0, index), ...prev.slice(index + 1)]);
    refreshRepr();
  };

  const handleAddTerminal = () => {
    const maybeError = grammarCoreRef.current.addTerminals([newTerminal]);
    if (maybeError) {
      alert(maybeError.details);
      return;
    }
    setTerminals(prev => [...prev, newTerminal]);
    setNewTerminal("");
    refreshRepr();
  };

  const handleDeleteTerminal = (index: number) => {
    const terminal = terminals[index];
    const maybeError = grammarCoreRef.current.removeTerminal(terminal);
    if (maybeError) {
      alert(maybeError.details);
      return;
    }
    setTerminals(prev => [...prev.slice(0, index), ...prev.slice(index + 1)]);
    refreshRepr();
  };

  const handleAddRule = () => {
    const input = newRule.input.trim();
    const outputArr = newRule.output.trim().split(" ").filter(Boolean);
    if (!input || outputArr.length === 0) {
      alert("Please enter both LHS and RHS.");
      return;
    }

    const maybeError = grammarCoreRef.current.addProductionRule(input, outputArr);
    if (maybeError) {
      alert(maybeError.details);
      return;
    }
    const rule = { input, output: outputArr };
    setRules([...rules, rule]);
    refreshRepr();
    setNewRule({ input: "", output: "" });
  };

  const handleDeleteRule = (index: number) => {
    const ruleId = grammarCoreRef.current.visual.getRuleIdByIndex(index);
    if (ruleId === undefined) {
      alert("Trying to remove non-existent rule");
    }
    const maybeError = grammarCoreRef.current.removeProductionRule(ruleId as string);
    if (maybeError) {
      alert(maybeError.details);
      return;
    }
    setRules(prev => [...prev.slice(0, index), ...prev.slice(index + 1)]);
    refreshRepr();
  };

  return (
    <div>
      <h2>GRAMATIKA</h2>

      <div>
        <h3>Non-Terminals:</h3>
        {nonTerminals.map((nonTerminal, index) =>
          <div key={index}>
            <span>{nonTerminal}</span>
            <button onClick={() => handleDeleteNonTerminal(index)}>
              Delete
            </button>
          </div>
        )}
        <div>
          <input
            value={newNonTerminal}
            onChange={e => setNewNonTerminal(e.target.value)}
            placeholder="Non-Terminal (e.g. A)"
          />
          <button onClick={handleAddNonTerminal}>Add Non-Terminal</button>
        </div>
      </div>

      <div>
        <h3>Terminals:</h3>
        {terminals.map((terminal, index) =>
          <div key={index}>
            <span>{terminal}</span>
            <button onClick={() => handleDeleteTerminal(index)}>
              Delete
            </button>
          </div>
        )}
        <div>
          <input
            value={newTerminal}
            onChange={e => setNewTerminal(e.target.value)}
            placeholder="Terminal (e.g. a)"
          />
          <button onClick={handleAddTerminal}>Add Terminal</button>
        </div>
      </div>

      <h3>Rules:</h3>
      {rules.map((rule, index) =>
        <div key={index}>
          <span>{rule.input} → {rule.output.join(" ")}</span>
          <button onClick={() => handleDeleteRule(index)}>Delete</button>
        </div>
      )}
      <div>
        <input
          value={newRule.input}
          onChange={e => setNewRule({ ...newRule, input: e.target.value })}
          placeholder="LHS (e.g. S)"
        />
        →
        <input
          value={newRule.output}
          onChange={e => setNewRule({ ...newRule, output: e.target.value })}
          placeholder="RHS (e.g. a A)"
        />
        <button onClick={handleAddRule}>Add Rule</button>
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
