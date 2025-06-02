// algorithm, simulation

import { useState } from "react";
import AlgorithmButtons from "./AlgorithmButtons";
import SimulationButtons from "./SimulationButtons";
import { StartAutomatonAlgorithmButton, StartGrammarAlgorithmButton } from "./StartAlgorithmButton";

export enum Running {
  NOTHING,
  SIMULATION,
  ALGORITHM
}

export function AutomatonVisualButtons() {
  const [buttonSet, setButtonSet] = useState<Running>(Running.NOTHING);

  return (
    <>
      {buttonSet === Running.NOTHING ? <StartAutomatonAlgorithmButton setButtonSet={setButtonSet} /> : null}
      {buttonSet !== Running.ALGORITHM ? <SimulationButtons buttonSet={buttonSet} setButtonSet={setButtonSet} /> : null}
      {buttonSet === Running.ALGORITHM ? <AlgorithmButtons setButtonSet={setButtonSet} /> : null}
    </>
  );
}

export function GrammarVisualButtons() {
  const [buttonSet, setButtonSet] = useState<Running>(Running.NOTHING);

  return (
    <>
      {buttonSet === Running.NOTHING ? <StartGrammarAlgorithmButton setButtonSet={setButtonSet} /> : <AlgorithmButtons setButtonSet={setButtonSet} />}
    </>
  );
}
