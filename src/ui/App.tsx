import "./App.css";
import { CoreContext } from "../core/CoreContext";
import Buttons from "./Buttons.tsx";
import Windows from "./Windows.tsx";
import { useContext, useState } from "react";
import { Mode, ObjectType } from "../core/core.ts";

export default function App() {
  const core = useContext(CoreContext);

  if (!core) {
    throw new Error("SwitchModeButtons must be used within a CoreProvider");
  }

  const [mode, setMode] = useState<Mode>(Mode.EDIT);
  const [primaryType, setPrimaryType] = useState<ObjectType>(ObjectType.AUTOMATON_FINITE);
  const [secondaryType, setSecondaryType] = useState<ObjectType | undefined>(undefined);

  core.setMode = setMode;
  core.setPrimaryType = setPrimaryType;
  core.setSecondaryType = setSecondaryType;

  return (
    <div className="container-fluid">
      <h1>Víla Fojálka</h1>
      <Buttons mode={mode} primaryType={primaryType} />
      <Windows primaryType={primaryType} secondaryType={secondaryType} />
    </div>
  );
}
