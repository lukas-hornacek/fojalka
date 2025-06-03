import "./styles/main.css";
import MainMenu from "./MainMenu.tsx";
import Windows from "./Windows.tsx";
import { createContext, useState } from "react";
import { Core, ICore, ICoreType, Mode } from "../core/core.ts";

export const CoreContext = createContext<ICore | undefined>(undefined);

export default function App() {
  const [core, setCore] = useState<ICore>(new Core());

  const [mode, setMode] = useState<Mode>(core.mode.mode);
  const [primaryType, setPrimaryType] = useState<ICoreType>(core.primary);
  const [secondaryType, setSecondaryType] = useState<ICoreType | undefined>(core.secondary);

  core.setMode = setMode;
  core.setPrimaryType = setPrimaryType;
  core.setSecondaryType = setSecondaryType;

  return (
    <CoreContext.Provider value={core}>
      <div className="container-fluid">
        <h1>Víla Fojálka</h1>
        <MainMenu mode={mode} primaryType={primaryType} setCore={setCore}/>
        <Windows primaryType={primaryType} secondaryType={secondaryType} />
      </div>
    </CoreContext.Provider>
  );
}
