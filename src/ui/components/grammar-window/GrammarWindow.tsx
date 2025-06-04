import React, { useContext, useEffect, useState } from "react";
import { Kind, Mode } from "../../../core/core.ts";
import GrammarRepresentation from "./GrammarRepresentation";
import "./styles.css";
import { exportGrammar } from "../../importAndExport.ts";
import { CoreContext } from "../../App.tsx";

interface ProductionRule {
  input: string;
  output: string[];
}

interface GrammarWindowProps {
  primary: boolean;
}

export const GrammarWindow: React.FC<GrammarWindowProps> = ({ primary }) => {
  const core = useContext(CoreContext);

  if (core === undefined) {
    throw new Error("GrammarWindow must be used within a CoreProvider");
  }

  const grammar = primary ? core.primary : core.secondary!;

  if (grammar.kind !== Kind.GRAMMAR) {
    throw new Error("GrammarWindow must be used with GrammarCore");
  }

  const [nonTerminals, setNonTerminals] = useState<string[]>(
    grammar.grammar.nonTerminalSymbols
  );
  const [terminals, setTerminals] = useState<string[]>(
    grammar.grammar.terminalSymbols
  );
  const [rules, setRules] = useState<ProductionRule[]>(
    grammar.grammar.productionRules.map((rule) => ({
      input: rule.inputNonTerminal,
      output: rule.outputSymbols,
    }))
  );
  const [newRule, setNewRule] = useState({ input: "", output: "" });
  const [newNonTerminal, setNewNonTerminal] = useState("");
  const [newTerminal, setNewTerminal] = useState("");

  const [grammarRepr, setGrammarRepr] = useState<React.ReactNode>(
    grammar.display()
  );
  grammar.visual.refresher = setGrammarRepr;

  useEffect(() => {
    setNonTerminals(grammar.grammar.nonTerminalSymbols);
    setTerminals(grammar.grammar.terminalSymbols);
    setRules(
      grammar.grammar.productionRules.map((rule) => ({
        input: rule.inputNonTerminal,
        output: rule.outputSymbols,
      }))
    );
    setNewRule({ input: "", output: "" });
    setNewNonTerminal("");
    setNewTerminal("");
    grammar.visual.refresh();
    setGrammarRepr(grammar.display());

    refreshRepr();
  }, [grammar]);

  useEffect(() => {
    setRules(
      grammar.grammar.productionRules.map((rule) => ({
        input: rule.inputNonTerminal,
        output: rule.outputSymbols,
      }))
    );
  }, [grammarRepr, grammar]);

  // This method has to be called everytime a change is made to the grammar (to obtain the updated string repr.)
  const refreshRepr = () => {
    const newRepr = grammar.display();
    setGrammarRepr(newRepr);
  };

  const handleAddNonTerminal = () => {
    const maybeError = grammar.addNonterminals([newNonTerminal]);
    if (maybeError) {
      alert(maybeError.details);
      return;
    }
    setNonTerminals(grammar.grammar.nonTerminalSymbols);
    setNewNonTerminal("");
    refreshRepr();
  };

  const handleDeleteNonTerminal = (index: number) => {
    const nonTerminal = nonTerminals[index];
    const maybeError = grammar.removeNonterminal(nonTerminal);
    if (maybeError) {
      alert(maybeError.details);
      return;
    }
    setNonTerminals(grammar.grammar.nonTerminalSymbols);
    refreshRepr();
  };

  const handleAddTerminal = () => {
    const maybeError = grammar.addTerminals([newTerminal]);
    if (maybeError) {
      alert(maybeError.details);
      return;
    }
    setTerminals(grammar.grammar.terminalSymbols);
    setNewTerminal("");
    refreshRepr();
  };

  const handleDeleteTerminal = (index: number) => {
    const terminal = terminals[index];
    const maybeError = grammar.removeTerminal(terminal);
    if (maybeError) {
      alert(maybeError.details);
      return;
    }
    setTerminals(grammar.grammar.terminalSymbols);
    refreshRepr();
  };

  const handleAddRule = () => {
    const input = newRule.input.trim();
    const outputArr = newRule.output.trim().split(" ").filter(Boolean);
    if (!input || outputArr.length === 0) {
      alert("Please enter both LHS and RHS.");
      return;
    }

    const maybeError = grammar.addProductionRule(input, outputArr);
    if (maybeError) {
      console.log(maybeError);
      alert(maybeError.details);
      return;
    }
    setRules(
      grammar.grammar.productionRules.map((rule) => ({
        input: rule.inputNonTerminal,
        output: rule.outputSymbols,
      }))
    );
    refreshRepr();
    setNewRule({ input: "", output: "" });
  };

  const handleDeleteRule = (index: number) => {
    const ruleId = grammar.visual.getRuleIdByIndex(index);
    if (ruleId === undefined) {
      alert("Trying to remove non-existent rule");
    }
    const maybeError = grammar.removeProductionRule(ruleId as string);
    if (maybeError) {
      alert(maybeError.details);
      return;
    }
    setRules(
      grammar.grammar.productionRules.map((rule) => ({
        input: rule.inputNonTerminal,
        output: rule.outputSymbols,
      }))
    );
    refreshRepr();
  };

  return (
    <div className="grammar-container">
      <button
        className="btn btn-primary"
        onClick={() => {
          console.log(exportGrammar(grammar));
        }}
      >
        Export
      </button>

      <h2 className="grammar-header">Gramatika</h2>

      <div className="section">
        <h3>Non-Terminals</h3>
        <div className="list">
          {nonTerminals.map((nt, i) =>
            <div key={i} className="list-item">
              <span>{nt}</span>
              {core.mode.mode === Mode.EDIT ?
                <button
                  onClick={() => handleDeleteNonTerminal(i)}
                  className="delete-btn"
                >
                  ✕
                </button>
                : null}
            </div>
          )}
        </div>
        {core.mode.mode === Mode.EDIT ?
          <div className="input-row">
            <input
              value={newNonTerminal}
              onChange={(e) => setNewNonTerminal(e.target.value)}
              placeholder="Non-terminal (e.g. A)"
            />
            <button onClick={handleAddNonTerminal}>Add</button>
          </div>
          : null}
      </div>

      <div className="section">
        <h3>Terminals</h3>
        <div className="list">
          {terminals.map((t, i) =>
            <div key={i} className="list-item">
              <span>{t}</span>
              {core.mode.mode === Mode.EDIT ?
                <button
                  onClick={() => handleDeleteTerminal(i)}
                  className="delete-btn"
                >
                  ✕
                </button>
                : null}
            </div>
          )}
        </div>
        {core.mode.mode === Mode.EDIT ?
          <div className="input-row">
            <input
              value={newTerminal}
              onChange={(e) => setNewTerminal(e.target.value)}
              placeholder="Terminal (e.g. a)"
            />
            <button onClick={handleAddTerminal}>Add</button>
          </div>
          : null}
      </div>

      <div className="section">
        <h3>Production Rules</h3>
        <div className="list">
          {rules.map((r, i) =>
            <div key={i} className="list-item">
              <span>
                {r.input} → {r.output.join(" ")}
              </span>
              {core.mode.mode === Mode.EDIT ?
                <button
                  onClick={() => handleDeleteRule(i)}
                  className="delete-btn"
                >
                  ✕
                </button>
                : null}
            </div>
          )}
        </div>
        {core.mode.mode === Mode.EDIT ?
          <div className="input-row rule-input-row">
            <input
              value={newRule.input}
              onChange={(e) =>
                setNewRule({ ...newRule, input: e.target.value })
              }
              placeholder="LHS (e.g. S)"
            />
            <span>→</span>
            <input
              value={newRule.output}
              onChange={(e) =>
                setNewRule({ ...newRule, output: e.target.value })
              }
              placeholder="RHS (e.g. a A)"
            />
            <button onClick={handleAddRule}>Add Rule</button>
          </div>
          : null}
      </div>

      <GrammarRepresentation grammarRepr={grammarRepr} />
    </div>
  );
};

export default GrammarWindow;
