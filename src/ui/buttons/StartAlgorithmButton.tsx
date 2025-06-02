import { Dropdown, DropdownButton } from "react-bootstrap";
import { Running } from "./VisualButtons";
import { AutomatonToGrammarAlgorithm, NondeterministicToDeterministicAlgorithm, RemoveEpsilonAlgorithm } from "../../engine/algorithm/automatonAlgorithms";
import { IAlgorithm } from "../../engine/algorithm/algorithm";
import { useContext } from "react";
import { CoreContext } from "../../core/CoreContext";
import { GrammarNormalFormAlgorithm, GrammarToAutomatonAlgorithm } from "../../engine/algorithm/grammarAlgorithms";
import { Kind } from "../../core/core";
import { GrammarType } from "../../engine/grammar/grammar";
import { AutomatonType } from "../../engine/automaton/automaton";

interface AlgorithmWrapper {
  name: string,
  // this overlap is dangerous but it works as long as StartGrammarAlgorithmButton and
  // StartGrammarAutomatonButton first check if object is of correct Kind
  inputType: GrammarType | AutomatonType,
  algorithm: () => IAlgorithm,
}

export function StartGrammarAlgorithmButton({ setButtonSet }: { setButtonSet: React.Dispatch<React.SetStateAction<Running>> }) {
  const core = useContext(CoreContext);
  if (core === undefined) {
    throw new Error("StartGrammarAlgorithmButton must be used within CoreProvider.");
  }

  const algorithms: AlgorithmWrapper[] = [
    {
      name: "Regulárna gramatika -> nedeterministický automat",
      inputType: GrammarType.REGULAR,
      algorithm: () => {
        if (core.primary.kind != Kind.GRAMMAR) {
          throw new Error("Invalid algorithm input type");
        }
        return new GrammarToAutomatonAlgorithm(core.primary);
      },
    },
    {
      name: "Normálna forma",
      inputType: GrammarType.REGULAR,
      algorithm: () => {
        if (core.primary.kind != Kind.GRAMMAR) {
          throw new Error("Invalid algorithm input type.");
        }
        return new GrammarNormalFormAlgorithm(core.primary);
      },
    }
  ];

  function startAlgorithm(algorithm: IAlgorithm) {
    const e = core?.algorithmStart(algorithm);
    if (e !== undefined) {
      alert(e.details);
      return;
    }
    setButtonSet(Running.ALGORITHM);
  }

  const dropdownItems = algorithms
    .filter(a => core.primary.kind === Kind.GRAMMAR && core.primary.grammar.grammarType === a.inputType)
    .map(a => <Dropdown.Item key={a.name} onClick={() => startAlgorithm(a.algorithm())}>{a.name}</Dropdown.Item>);

  return (
    <>
      <DropdownButton id="dropdown-algorithm-button" title="Start algorithm">
        {dropdownItems.length > 0 ? dropdownItems : <Dropdown.Item disabled>No algorithms available</Dropdown.Item>}
      </DropdownButton>
    </>
  );
}

export function StartAutomatonAlgorithmButton({ setButtonSet }: { setButtonSet: React.Dispatch<React.SetStateAction<Running>> }) {
  const core = useContext(CoreContext);
  if (core === undefined) {
    throw new Error("StartAutomatonAlgorithmButton must be used within CoreProvider.");
  }

  const algorithms: AlgorithmWrapper[] = [
    {
      name: "Nedeterministický automat -> deterministický automat",
      inputType: AutomatonType.FINITE,
      algorithm: () => {
        if (core.primary.kind != Kind.AUTOMATON) {
          throw new Error("Invalid algorithm input type.");
        }
        return new NondeterministicToDeterministicAlgorithm(core.primary);
      },
    },
    {
      name: "Odepsilonovanie",
      inputType: AutomatonType.FINITE,
      algorithm: () => {
        if (core.primary.kind != Kind.AUTOMATON) {
          throw new Error("Invalid algorithm input type.");
        }
        return new RemoveEpsilonAlgorithm(core.primary);
      }
    },
    {
      name: "Nedeterministický automat -> regulárna gramatika",
      inputType: AutomatonType.FINITE,
      algorithm: () => {
        if (core.primary.kind != Kind.AUTOMATON) {
          throw new Error("Invalid algorithm input type.");
        }
        return new AutomatonToGrammarAlgorithm(core.primary);
      }
    },
  ];

  function startAlgorithm(algorithm: IAlgorithm) {
    const e = core?.algorithmStart(algorithm);
    if (e !== undefined) {
      alert(e.details);
      return;
    }
    setButtonSet(Running.ALGORITHM);
  }

  const dropdownItems = algorithms
    .filter(a => core.primary.kind === Kind.AUTOMATON && core.primary.automaton.automatonType === a.inputType)
    .map(a => <Dropdown.Item key={a.name} onClick={() => startAlgorithm(a.algorithm())}>{a.name}</Dropdown.Item>);

  return (
    <>
      <DropdownButton id="dropdown-algorithm-button" title="Start algorithm">
        {dropdownItems.length > 0 ? dropdownItems : <Dropdown.Item disabled>No algorithms available</Dropdown.Item>}
      </DropdownButton>
    </>
  );
}
