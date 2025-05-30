import { useContext, useState } from "react";
import { CoreContext } from "../core/CoreContext";
import { IAutomatonCore } from "../core/automatonCore";
import { Kind, Mode } from "../core/core";

export default function VisualWindows() {
  const coreContext = useContext(CoreContext);
  // used temporary as for state change signalization
  const [automatonCore, setAutomatonCore] = useState<IAutomatonCore | null>(null);

  const [simulationWord, setSimulationWord] = useState("aa");
  const [simulationWordPos, setSimulationWordPos] = useState(0);
  const [wordRead, setWordRead] = useState<string[]>([]);
  const [wordRemaining, setWordRemaining] = useState<string[]>([]);

  const [errorMessage, setErrorMessage] = useState<IErrorMessage | undefined>(undefined);

  function clearAll() {
    setErrorMessage(undefined);
  }

  const startSimulation = (word: string[]) => {
    if (coreContext == undefined) {
      return;
    }

    const core = coreContext.primary;
    if (core.kind == Kind.AUTOMATON) {
      core.runStart(word);
      setAutomatonCore(core);
      setSimulationWordPos(0);
      setWordRemaining(word);
      setWordRead([]);
    }
  };
  const stopSimulation = () => {
    if (coreContext == undefined) {
      return;
    }
    const core = coreContext.primary;
    if (core.kind == Kind.AUTOMATON) {
      core.runEnd();
      setAutomatonCore(null);
      setSimulationWordPos(0);
      setWordRemaining([]);
      setWordRead([]);
    }
  };

  function nextStep() {
    if (automatonCore == null) {
      return;
    }

    setErrorMessage(undefined);
    const error = automatonCore.runNext();
    if (error) {
      if (error.details === "Input end reached") {
        alert("Si na konci slova!");
      }
      return;
    }

    setWordRead(Array.prototype.concat(wordRead, wordRemaining[0]));
    setWordRemaining(wordRemaining.slice(1));
    setSimulationWordPos(simulationWordPos + 1);
  }
  function prevStep() {
    if (automatonCore == null) {
      return;
    }

    setErrorMessage(undefined);
    const error = automatonCore.runUndo();
    if (error) {
      if (error.details === "Cannot undo because command history is empty.") {
        alert("Si na začiatku slova!");
      }
      return;
    }

    setWordRemaining(Array.prototype.concat(wordRemaining, wordRead[0]));
    setWordRead(wordRead.slice(1));
    setSimulationWordPos(simulationWordPos - 1);
  }

  return (
    <>
      <hr/>
      <h2>Simulacia</h2>
      <div hidden={coreContext?.mode.mode != Mode.VISUAL && false}>
        <div hidden={automatonCore !== null}>
          vstupné slovo: <input
            type="text"
            value={simulationWord}
            onChange={w => setSimulationWord(w.target.value)}
            placeholder="ababba"
            disabled={automatonCore !== null}
          />
          <button onClick={() => { startSimulation(simulationWord.split("")); clearAll(); }}>Simuluj slovo</button> <br />
        </div>
        <div hidden={automatonCore === null}>
          čítané slovo:
          <input type="text" size={wordRead.length + 1} value={wordRead.join("")} readOnly/>
          <input type="text" size={wordRemaining.length + 1} value={"→" + wordRemaining.join("")} readOnly/>
          <button onClick={() => { stopSimulation(); setErrorMessage(undefined); }} hidden={automatonCore == null}>stopni simulaciu</button> <br/>
          <button onClick={prevStep}>predchadzajuci krok</button>
          <button onClick={nextStep}>dalsi krok</button> <br />
          <div hidden={errorMessage === undefined}>
            {errorMessage?.details}
          </div>
        </div>
      </div>
    </>
  );
}
