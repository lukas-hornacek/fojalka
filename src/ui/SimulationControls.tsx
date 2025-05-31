import { useContext, useState } from "react";
import { CoreContext } from "../core/CoreContext";
import { IAutomatonCore } from "../core/automatonCore";
import { Kind, Mode } from "../core/core";

export default function VisualWindows() {
  const coreContext = useContext(CoreContext);
  // used temporary as for state change signalization
  const [automatonCore, setAutomatonCore] = useState<IAutomatonCore | null>(null);

  const [simulationWord, setSimulationWord] = useState("aabc");
  const [simulationWordPos, setSimulationWordPos] = useState(0);
  const [wordRead, setWordRead] = useState<string[]>([]);
  const [wordRemaining, setWordRemaining] = useState<string[]>([]);
  const [steppping, setStepping] = useState(false);
  const [stepInterval, setStepInterval] = useState<number>(1.0);

  const startSimulation = () => {
    if (coreContext == undefined) {
      return;
    }

    const word = simulationWord.split("");

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
      stopTimer();
    }
  };

  // returns wether succeded
  function nextStep(): boolean {
    if (automatonCore == null) {
      return false;
    }

    const error = automatonCore.runNext();
    if (error) {
      if (error.details === "Input end reached") {
        alert("Si na konci slova!");
      } else {
        console.log(error);
      }
      return false;
    }

    setWordRead(Array.prototype.concat(wordRead, wordRemaining[0]));
    setWordRemaining(wordRemaining.slice(1));
    setSimulationWordPos(simulationWordPos + 1);

    console.log(Array.prototype.concat(wordRead, wordRemaining[0]), wordRemaining.slice(1));

    return true;
  }

  function prevStep() {
    if (automatonCore == null) {
      return false;
    }

    const error = automatonCore.runUndo();
    if (error) {
      if (error.details === "Cannot undo because command history is empty.") {
        alert("Si na začiatku slova!");
      } else {
        console.log(error);
      }
      return false;
    }

    setWordRemaining(Array.prototype.concat(wordRead[0], wordRemaining));
    setWordRead(wordRead.slice(1));
    setSimulationWordPos(simulationWordPos - 1);

    return true;
  }

  const [timeInterval, setTimeInterval] = useState<number | undefined>(undefined);

  // Function to start the timer
  const startTimer = () => {
    setStepping(true);
    setTimeInterval(setInterval(() => {
      if (!nextStep()) {
        stopTimer();
      }
    }, stepInterval * 1000));
  };

  // Function to pause the timer
  const stopTimer = () => {
    setStepping(false);
    clearInterval(timeInterval);
  };

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
          <button onClick={startSimulation}>Simuluj slovo</button> <br />
        </div>
        <div hidden={automatonCore === null}>
          čítané slovo:
          <input type="text" size={wordRead.length + 1} value={wordRead.join("")} readOnly/>
          <input type="text" size={wordRemaining.length + 1} value={"→" + wordRemaining.join("")} readOnly/>
          <button onClick={() => stopSimulation()} hidden={automatonCore == null}>stopni simulaciu</button> <br/>
          <button onClick={prevStep}>predchadzajuci krok</button>
          <button onClick={nextStep}>dalsi krok</button> <br />
          autoplay
          <div hidden={steppping}>
            <button onClick={startTimer}>&#x23F5;</button> | rýchlosť<input type="number" min={0.1} max={2.0} step={0.1} value={stepInterval} onChange={v => setStepInterval(Number(v.target.value))}/>
          </div>
          <button onClick={stopTimer} hidden={!steppping}>&#x23F8;</button>
        </div>
      </div>
    </>
  );
}
