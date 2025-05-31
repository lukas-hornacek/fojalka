import { useContext, useState, useRef, useEffect } from "react";
import { CoreContext } from "../core/CoreContext";
import { IAutomatonCore } from "../core/automatonCore";
import { Kind, Mode } from "../core/core";

export default function VisualWindows() {
  const coreContext = useContext(CoreContext);
  // used temporary as for state change signalization
  const [automatonCore, setAutomatonCore] = useState<IAutomatonCore | null>(null);

  const [simulationWord, setSimulationWord] = useState("aabc");
  const [wordRead, setWordRead] = useState<string[]>([]);
  const [wordRemaining, setWordRemaining] = useState<string[]>([]);
  const [steppping, setStepping] = useState(false);
  const [stepInterval, setStepInterval] = useState<number>(1.0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const startSimulation = () => {
    if (coreContext === undefined) {
      return;
    }

    const word = simulationWord.split("");

    const core = coreContext.primary;
    if (core.kind === Kind.AUTOMATON) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      const e = core.runStart(word);
      if(e !== undefined) {
        alert(e.details);
        return;
      }
      
      setAutomatonCore(core);
      setWordRemaining(word);
      setWordRead([]);
    }
  };
  const stopSimulation = () => {
    if (coreContext === undefined) {
      return;
    }
    const core = coreContext.primary;
    if (core.kind === Kind.AUTOMATON) {
      const e = core.runEnd();
      if(e !== undefined) {
        alert(e.details);
        return;
      }

      setAutomatonCore(null);
      setWordRemaining([]);
      setWordRead([]);
      stopTimer();
    }
  };

  // returns wether succeded
  function nextStep(): boolean {
    if (automatonCore === null) {
      return false;
    }

    const error = automatonCore.runNext();
    if (error) {
      alert(error.details);
      return false;
    }

    setWordRead(prev => [...prev, wordRemaining[0]]);
    setWordRemaining(prev => prev.slice(1));

    return true;
  }

  function prevStep() {
    if (automatonCore === null) {
      return false;
    }

    const error = automatonCore.runUndo();
    if (error) {
      alert(error.details);
      return false;
    }

    setWordRemaining(prev => [wordRead[0], ...prev]);
    setWordRead(prev => prev.slice(1));

    return true;
  }

  const intervalRef = useRef<number | null>(null);
  const startTimer = () => {
    setStepping(true);
    audioRef?.current?.play();
    if (intervalRef.current === null) { // prevent multiple intervals
      intervalRef.current = window.setInterval(() => {
        if (!nextStep()) {
          stopTimer();
        }
      }, stepInterval * 1000);
    }
  };
  const stopTimer = () => {
    setStepping(false);
    audioRef?.current?.pause();
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  // Cleanup timer on unmount to avoid dangling timers
  useEffect(() => () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const changePlaybackRate = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  return (
    <>
      <hr/>
      <h2>Simulacia</h2>
      <audio ref={audioRef} src="/fojalka/simulation-music.aac" hidden loop></audio>
      <div hidden={coreContext?.mode.mode !== Mode.VISUAL && false}>
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
          <button onClick={() => stopSimulation()} hidden={automatonCore === null}>stopni simulaciu</button> <br/>
          <button onClick={prevStep}>predchadzajuci krok</button>
          <button onClick={nextStep}>dalsi krok</button> <br />
          autoplay
          <div hidden={steppping}>
            <button onClick={startTimer}>&#x23F5;</button> | rýchlosť<input type="number" min={0.1} max={2.0} step={0.1} value={stepInterval} onChange={v => { setStepInterval(Number(v.target.value)); changePlaybackRate(Number(v.target.value)); }}/>
          </div>
          <button onClick={stopTimer} hidden={!steppping}>&#x23F8;</button>
        </div>
      </div>
    </>
  );
}
