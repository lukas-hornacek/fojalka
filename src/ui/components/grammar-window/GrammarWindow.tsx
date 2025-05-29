import React, { useState } from "react";
import { GrammarCore } from "../../../core/grammarCore.ts";
import { GrammarType } from "../../../engine/grammar/grammar.ts";
import { ModeHolder } from "../../../core/core.ts";
import GrammarRepresentation from "./GrammarRepresentation";
import "./styles.css";

interface ProductionRule {
  input: string;
  output: string[];
}

interface GrammarWindowProps {
  grammarType: GrammarType;
}

export const GrammarWindow: React.FC<GrammarWindowProps> = ({ grammarType }) => {
  // TODO Do not take grammarType from props, but from the Context instead
  const grammarCoreRef = React.useRef(new GrammarCore(grammarType, new ModeHolder()));
  const [nonTerminals, setNonTerminals] = useState<string[]>(["σ"]);
  const [terminals, setTerminals] = useState<string[]>([]);
  const [rules, setRules] = useState<ProductionRule[]>([]);
  const [newRule, setNewRule] = useState({ input: "", output: "" });
  const [newNonTerminal, setNewNonTerminal] = useState("");
  const [newTerminal, setNewTerminal] = useState("");

  const [grammarRepr, setGrammarRepr] = useState<React.ReactNode>();

  // This method has to be called everytime a change is made to the grammar (to obtain the updated string repr.)
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
    <div className="grammar-container">
      <h2 className="grammar-header">Gramatika</h2>

      <div className="section">
        <h3>Non-Terminals</h3>
        <div className="list">
          {nonTerminals.map((nt, i) =>
            <div key={i} className="list-item">
              <span>{nt}</span>
              <button onClick={() => handleDeleteNonTerminal(i)} className="delete-btn">✕</button>
            </div>
          )}
        </div>
        <div className="input-row">
          <input
            value={newNonTerminal}
            onChange={e => setNewNonTerminal(e.target.value)}
            placeholder="Non-terminal (e.g. A)"
          />
          <button onClick={handleAddNonTerminal}>Add</button>
        </div>
      </div>

      <div className="section">
        <h3>Terminals</h3>
        <div className="list">
          {terminals.map((t, i) =>
            <div key={i} className="list-item">
              <span>{t}</span>
              <button onClick={() => handleDeleteTerminal(i)} className="delete-btn">✕</button>
            </div>
          )}
        </div>
        <div className="input-row">
          <input
            value={newTerminal}
            onChange={e => setNewTerminal(e.target.value)}
            placeholder="Terminal (e.g. a)"
          />
          <button onClick={handleAddTerminal}>Add</button>
        </div>
      </div>

      <div className="section">
        <h3>Production Rules</h3>
        <div className="list">
          {rules.map((r, i) =>
            <div key={i} className="list-item">
              <span>{r.input} → {r.output.join(" ")}</span>
              <button onClick={() => handleDeleteRule(i)} className="delete-btn">✕</button>
            </div>
          )}
        </div>
        <div className="input-row rule-input-row">
          <input
            value={newRule.input}
            onChange={e => setNewRule({ ...newRule, input: e.target.value })}
            placeholder="LHS (e.g. S)"
          />
          <span>→</span>
          <input
            value={newRule.output}
            onChange={e => setNewRule({ ...newRule, output: e.target.value })}
            placeholder="RHS (e.g. a A)"
          />
          <button onClick={handleAddRule}>Add Rule</button>
        </div>
      </div>

      <GrammarRepresentation grammarRepr={grammarRepr} />

    </div>
  );
};

export default GrammarWindow;
