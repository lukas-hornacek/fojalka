import { useEffect, useContext } from "react";
import { CoreContext } from "../core/CoreContext";

export default function AutomatonWindow({ id, cols }: { id: string, cols: number }) {
  const coreContext = useContext(CoreContext);

  if (!coreContext) {
    throw new Error("AutomatonWindow must be used within a CoreProvider");
  }

  useEffect(() => {
    coreContext.init(id);
  }, [id, coreContext]);

  return (
    <div className={`col-${cols}`}>
      <div id={id}></div>
    </div>
  );
}
