import { Dropdown, DropdownButton } from "react-bootstrap";
import { Running } from "./VisualButtons";
import { AutomatonToGrammarAlgorithm, NondeterministicToDeterministicAlgorithm, RemoveEpsilonAlgorithm } from "../../engine/algorithm/automatonAlgorithms";
import { IAlgorithm } from "../../engine/algorithm/algorithm";
import { useContext } from "react";
import { CoreContext } from "../../core/CoreContext";
import { GrammarNormalFormAlgorithm, GrammarToAutomatonAlgorithm } from "../../engine/algorithm/grammarAlgorithms";
import { Kind } from "../../core/core";

interface AlgorithmWrapper {
  name: string,
  algorithm: () => IAlgorithm,
}

export function StartGrammarAlgorithmButton({ setButtonSet }: { setButtonSet: React.Dispatch<React.SetStateAction<Running>> }) {
  const core = useContext(CoreContext);
  if (core === undefined) {
    throw new Error("StartGrammarAlgorithmButton must be used within CoreProvider.");
  }

  const algorithms: AlgorithmWrapper[] = [
    {
      name: "Regulárna gramatika -> deterministický automat",
      algorithm: () => {
        if (core.primary.kind != Kind.GRAMMAR) {
          throw new Error("Invalid algorithm input type");
        }
        return new GrammarToAutomatonAlgorithm(core.primary);
      },
    },
    {
      name: "Normálna forma",
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

  const dropdownItems = algorithms.map(a =>
    <Dropdown.Item key={a.name} onClick={() => startAlgorithm(a.algorithm())}>{a.name}</Dropdown.Item>);

  return (
    <>
      <DropdownButton id="dropdown-algorithm-button" title="Start algorithm">
        {dropdownItems}
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
      algorithm: () => {
        if (core.primary.kind != Kind.AUTOMATON) {
          throw new Error("Invalid algorithm input type.");
        }
        return new NondeterministicToDeterministicAlgorithm(core.primary);
      },
    },
    {
      name: "Odepsilonovanie",
      algorithm: () => {
        if (core.primary.kind != Kind.AUTOMATON) {
          throw new Error("Invalid algorithm input type.");
        }
        return new RemoveEpsilonAlgorithm(core.primary);
      }
    },
    {
      name: "Deterministický automat -> regulárna gramatika",
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

  const dropdownItems = algorithms.map(a =>
    <Dropdown.Item key={a.name} onClick={() => startAlgorithm(a.algorithm())}>{a.name}</Dropdown.Item>);

  return (
    <>
      <DropdownButton id="dropdown-algorithm-button" title="Start algorithm">
        {dropdownItems}
      </DropdownButton>
    </>
  );
}
