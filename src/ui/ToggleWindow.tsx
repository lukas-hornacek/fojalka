import { useContext } from "react";
import { CoreContext } from "../core/CoreContext";

export default function ToggleWindow({ toggle }: { toggle: () => void }) {
  const coreContext = useContext(CoreContext);

  if (!coreContext) {
    throw new Error("ToggleWindow must be used within a CoreProvider");
  }

  return (
    <button className="btn btn-primary" onClick={toggle}>Toggle window</button>
  );
}
