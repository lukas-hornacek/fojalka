import { useContext, useState, useRef, useEffect } from "react";
import { CoreContext } from "../../core/CoreContext";
import { Kind } from "../../core/core";
import { EPSILON } from "../../constants";
import { Running } from "./VisualButtons";

export default function SimulationButton({ buttonSet, setButtonSet }: { buttonSet: Running, setButtonSet: React.Dispatch<React.SetStateAction<Running>> }) {
  const coreContext = useContext(CoreContext);
  if (coreContext === undefined) {
    throw new Error("StartSimulationButtons must be used within a CoreProvider");
  }

  const core = coreContext.primary;
  if (core.kind !== Kind.AUTOMATON) {
    throw new Error("StartSimulationButtons must be used with Automaton in primary window");
  }

  const [simulationWord, setSimulationWord] = useState("");
  const [wordRead, setWordRead] = useState<string[]>([]);
  const [wordRemaining, setWordRemaining] = useState<string[]>([]);
  const [steppping, setStepping] = useState(false);
  const [stepInterval, setStepInterval] = useState<number>(1.0);
  const audioRef = useRef<HTMLAudioElement>(null);
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

  const startSimulation = () => {
    const word = simulationWord.split("");

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    const e = core.runStart(word);
    if (e !== undefined) {
      alert(e.details);
      return;
    }

    setButtonSet(Running.SIMULATION);
    // TODO getRemainingInput()
    setWordRemaining(word);
    setWordRead([]);
  };

  const stopSimulation = () => {
    const e = core.runEnd();
    if (e !== undefined) {
      alert(e.details);
      return;
    }

    setButtonSet(Running.NOTHING);
    setWordRemaining([]);
    setWordRead([]);
    stopTimer();
  };

  // returns wether succeded
  function nextStep(): boolean {
    if (core.kind !== Kind.AUTOMATON) {
      return false;
    }

    const error = core.runNext();
    if (error) {
      alert(error.details);
      return false;
    }

    const newRemaining = core.getRemainingInput();
    if (!newRemaining) {
      return false;
    }

    if (wordRemaining.length != newRemaining.length) {
      setWordRead(prev => [...prev, wordRemaining[0]]);
      setWordRemaining(prev => prev.slice(1));
    }

    return true;
  }

  function prevStep() {
    if (core.kind !== Kind.AUTOMATON) {
      return false;
    }

    const error = core.runUndo();
    if (error) {
      alert(error.details);
      return false;
    }

    const newRemaining = core.getRemainingInput();
    if (!newRemaining) { return false; }

    if (wordRemaining.length != newRemaining.length) {
      setWordRemaining(prev => [wordRead[0], ...prev]);
      setWordRead(prev => prev.slice(1));
    }

    return true;
  }

  // this should never be Running.ALGORITHM here
  if (buttonSet === Running.NOTHING) {
    return (
      <div>
        vstupné slovo: <input
          type="text"
          value={simulationWord}
          onChange={w => setSimulationWord(w.target.value)}
          placeholder={EPSILON}
        />
        <button onClick={startSimulation}>Simuluj slovo</button> <br />
      </div>
    );
  } else {
    return (
      <div>
        <audio ref={audioRef} src="/fojalka/simulation-music.aac" hidden loop></audio>
        <div>
          čítané slovo:
          <input type="text" size={wordRead.length + 1} value={wordRead.join("")} readOnly/>
          <input type="text" size={wordRemaining.length + 1} value={"→" + wordRemaining.join("")} readOnly/>
          <button onClick={() => stopSimulation()}>stopni simulaciu</button> <br/>
          <button onClick={prevStep}>predchadzajuci krok</button>
          <button onClick={nextStep}>dalsi krok</button> <br />
          autoplay
          <div hidden={steppping}>
            <button onClick={startTimer}>&#x23F5;</button> | rýchlosť<input type="number" min={0.1} max={2.0} step={0.1} value={stepInterval} onChange={v => { setStepInterval(Number(v.target.value)); changePlaybackRate(Number(v.target.value)); }}/>
          </div>
          <button onClick={stopTimer} hidden={!steppping}>&#x23F8;</button>
        </div>
      </div>
    );
  }
}
