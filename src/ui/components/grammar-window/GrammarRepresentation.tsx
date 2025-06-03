import React from "react";
import "./styles.css";

interface GrammarRepresentationProps {
  grammarRepr: React.ReactNode;
}

const GrammarRepresentation: React.FC<GrammarRepresentationProps> = ({ grammarRepr }) => {
  if (!grammarRepr) { return null; }

  return (
    <div className="section">
      <h3>Grammar Representation</h3>
      <pre className="grammar-representation">{grammarRepr}</pre>
    </div>
  );
};

export default GrammarRepresentation;
