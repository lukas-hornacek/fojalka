import { useEffect, useContext } from "react";
import { CoreContext } from "../core/CoreContext";

export default function AutomatonWindow() {
    const coreContext = useContext(CoreContext);

    if (!coreContext) {
        throw new Error("AutomatonWindow must be used within a CoreProvider");
    }

    useEffect(() => {
        coreContext.init();
    }, [coreContext]);

    return (
        <div id="cy"></div>
    );
}