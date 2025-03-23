import React, { createContext, useEffect, useRef, useState } from "react";
import cytoscape, { Core } from "cytoscape";

interface CytoscapeContextType {
  cy: Core | null;
  addNode: (id: string, position: { x: number; y: number }) => void;
}

export const CytoscapeContext = createContext<CytoscapeContextType | undefined>(undefined);

export const CytoscapeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cyRef = useRef<Core | null>(null);
  const [cy, setCy] = useState<Core | null>(null);

  useEffect(() => {
    if (!cyRef.current) {
      cyRef.current = cytoscape({
        container: document.getElementById("cy"),
        // example elements, that should be removed once user can add them themselves
        elements: [
          { group: "nodes", data: { id: "x" }, position: { x: 100, y: 100 } },
          { group: "nodes", data: { id: "y" }, position: { x: 300, y: 100 } },
          { group: "edges", data: { id: "a", source: "x", target: "y" } },
        ],
        style: [
          {
            selector: "node",
            style: {
              "background-color": "#666",
              label: "data(id)",
            },
          },
          {
            selector: "edge",
            style: {
              width: 3,
              "line-color": "#ccc",
              "target-arrow-color": "#ccc",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              label: "data(id)",
            },
          },
        ],
        layout: { name: "preset" },
      });
      setCy(cyRef.current);
    }
  }, []);

  const addNode = (id: string, position: { x: number; y: number }) => {
    cyRef.current?.add({ group: "nodes", data: { id }, position });
  };

  return (
    <CytoscapeContext.Provider value={{ cy, addNode }}>
      {children}
    </CytoscapeContext.Provider>
  );
};
