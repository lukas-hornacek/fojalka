import fcose from "cytoscape-fcose";
import cytoscape from "cytoscape";

cytoscape.use(fcose);

export function cyLayout(cy: cytoscape.Core | undefined) {
  const options = {
    name: "fcose",

    animate: true,

    // The layout animates only after this many milliseconds for animate:true
    // (prevents flashing on fast runs)
    animationThreshold: 250,

    // Number of iterations between consecutive screen positions update
    refresh: 20,

    // Whether to fit the network view after when done
    fit: true,

    // Padding on fit
    padding: 30,

    // Constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
    boundingBox: undefined,

    // Excludes the label when calculating node bounding boxes for the layout algorithm
    nodeDimensionsIncludeLabels: true,

    // Randomize the initial positions of the nodes (true) or use existing positions (false)
    randomize: false,

    // Extra spacing between components in non-compound graphs
    componentSpacing: 20,

    // Node repulsion (non overlapping) multiplier
    nodeRepulsion: function () {
      return 2048;
    },

    // Node repulsion (overlapping) multiplier
    nodeOverlap: 8,

    // Ideal edge (non nested) length
    idealEdgeLength: function () {
      return 128;
    },

    // Nesting factor (multiplier) to compute ideal edge length for nested edges
    nestingFactor: 1.2,

    // Gravity force (constant)
    gravity: 0.25,

    // Maximum number of iterations to perform
    numIter: 1000,
  };

  if (cy != null) {
    cy.layout(options).run();
  }
}
